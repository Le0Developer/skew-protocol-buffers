package gen

import (
	"fmt"
	"math/rand"
	"strconv"
	"strings"

	"google.golang.org/protobuf/types/descriptorpb"
)

func (g *Gen) generateMessageType(namespace string, messageType *descriptorpb.DescriptorProto) error {
	name := messageType.GetName()
	if name == "" {
		return fmt.Errorf("message type has no name")
	}
	fullName := namespace + "." + name

	oneOfs := []*oneOfInfo{}
	for i, oneof := range messageType.OneofDecl {
		name := oneof.GetName()
		if name == "" {
			return fmt.Errorf("oneof in message type %s has no name", name)
		}

		oneOfs = append(oneOfs, &oneOfInfo{
			Name:   title(name),
			Index:  i,
			Fields: []fieldInfo{},
		})
	}

	fields := []fieldInfo{}

	for _, field := range messageType.Field {
		fieldName := field.GetName()
		if fieldName == "" {
			return fmt.Errorf("field in message type %s has no name", name)
		}

		fieldType := field.GetType().String()
		if fieldType == "" {
			return fmt.Errorf("field %s in message type %s has no type", fieldName, name)
		}

		typeInfo, ok := typeMap[field.GetType()]
		if !ok {
			return fmt.Errorf("unsupported field type %s for field %s in message type %s", fieldType, fieldName, name)
		}

		fieldInfo := fieldInfo{
			G:          g,
			Field:      field,
			TypeInfo:   typeInfo,
			SkewType:   typeInfo.SkewType,
			Repeated:   field.GetLabel() == descriptorpb.FieldDescriptorProto_LABEL_REPEATED,
			HasDefault: field.GetDefaultValue() != "",
		}

		if fieldInfo.SkewType == "" {
			typ := strings.TrimPrefix(field.GetTypeName(), ".")
			fieldInfo.SkewType = typ
		}

		if field.OneofIndex != nil {
			oneOf := oneOfs[*field.OneofIndex]
			oneOf.Fields = append(oneOf.Fields, fieldInfo)
		}

		fields = append(fields, fieldInfo)
	}

	g.W.WriteLinef("# %s", fullName)
	if messageType.Options.GetDeprecated() {
		g.W.WriteLine("@deprecated")
	}
	g.W.WriteLinef("class %s {", name)
	g.W.WriteLine("# field definitions")

	// Randomize field order to avoid any implicit dependencies
	if g.options.ShuffleFields {
		rand.Shuffle(len(fields), func(i, j int) {
			fields[i], fields[j] = fields[j], fields[i]
		})
	}
	for _, field := range fields {
		g.W.WriteLinef("var %s = %s", field.PrivateName(), field.Initializer())
	}
	g.W.WriteLine("")
	for _, oneof := range oneOfs {
		g.W.WriteLinef("var _oneof_%d = %s.%s.None", oneof.Index, name, oneof.Name)
	}
	if g.options.PreserveUnknownFields {
		g.W.WriteLine("")
		g.W.WriteLine("var _unknownFields = List<int>.new")
	}

	g.W.WriteLine("")
	g.W.WriteLine("# field accessors")
	for _, field := range fields {
		g.generateMessageFieldAccessor(field)
	}

	g.W.WriteLine("# oneofs accessors")
	for _, oneof := range oneOfs {
		g.W.WriteLinef("def which%s %s.%s {", oneof.Name, name, oneof.Name)
		g.W.WriteLinef("return _oneof_%d", oneof.Index)
		g.W.WriteLine("}")
	}

	g.W.WriteLine("")
	g.W.WriteLine("# marshal")
	g.W.WriteLine("def marshal List<int> {")
	g.W.WriteLine("var writer = proto.Writer.new")

	if g.options.ShuffleFields {
		rand.Shuffle(len(fields), func(i, j int) {
			fields[i], fields[j] = fields[j], fields[i]
		})
	}
	for _, field := range fields {
		g.generateMessageFieldMarshaller(field)
	}

	if g.options.PreserveUnknownFields {
		g.W.WriteLinef("writer.write(_unknownFields)")
	}
	g.W.WriteLinef("return writer.buffer")
	g.W.WriteLine("}")

	g.W.WriteLine("")
	g.W.WriteLine("def marshalObject dynamic {")
	g.W.WriteLine("var result = {} as dynamic")

	if g.options.ShuffleFields {
		rand.Shuffle(len(fields), func(i, j int) {
			fields[i], fields[j] = fields[j], fields[i]
		})
	}

	for _, field := range fields {
		g.generateMessageFieldObjectMarshaller(field)
	}

	g.W.WriteLine("return result")
	g.W.WriteLine("}")

	g.W.WriteLine("}")

	g.W.WriteLinef("namespace %s {", name)
	g.W.WriteLine("# unmarshal")
	g.W.WriteLinef("def unmarshal(reader proto.Reader) %s {", name)
	g.W.WriteLinef("var message = %s.new", name)
	g.W.WriteLine("while !reader.done {")
	if g.options.PreserveUnknownFields {
		g.W.WriteLine("var start = reader.position")
	}
	g.W.WriteLine("var tag = reader.readTag")

	if g.options.ShuffleFields {
		rand.Shuffle(len(fields), func(i, j int) {
			fields[i], fields[j] = fields[j], fields[i]
		})
	}
	g.W.WriteLine("switch tag.fieldNumber {")
	for _, field := range fields {
		g.generateMessageFieldUnmarshaller(field, name, oneOfs)
	}
	if g.options.PreserveUnknownFields {
		g.W.WriteLine("default {")
		g.W.WriteLine("message._unknownFields.append(reader.readRaw(tag, start))")
		g.W.WriteLine("}")
	}
	g.W.WriteLine("}")
	g.W.WriteLine("}")

	g.W.WriteLine("return message")
	g.W.WriteLine("}")
	g.W.WriteLine("")
	g.W.WriteLinef("def unmarshal(buffer List<int>) %s {", name)
	g.W.WriteLine("return unmarshal(proto.Reader.new(buffer))")
	g.W.WriteLine("}")

	g.W.WriteLine("")
	g.W.WriteLine("# nested message types")
	for _, nestedMessage := range messageType.NestedType {
		if err := g.generateMessageType(fullName, nestedMessage); err != nil {
			return fmt.Errorf("error generating nested message type %s in message type %s: %w", nestedMessage.GetName(), name, err)
		}
	}

	g.W.WriteLine("")
	g.W.WriteLine("# nested enum types")
	for _, nestedEnum := range messageType.EnumType {
		if err := g.generateEnumType(nestedEnum); err != nil {
			return fmt.Errorf("error generating nested enum type %s in message type %s: %w", nestedEnum.GetName(), name, err)
		}
	}

	g.W.WriteLine("# oneofs")
	for _, oneof := range oneOfs {
		g.W.WriteLinef("enum %s {", oneof.Name)
		g.W.WriteLinef("None")
		for _, field := range oneof.Fields {
			if field.Field.Options.GetDeprecated() {
				g.W.WriteLine("@deprecated")
			}
			g.W.WriteLinef("%s", title(field.Name()))
		}
		g.W.WriteLine("}")
	}

	g.W.WriteLine("}")

	g.W.WriteLine("")
	g.W.WriteLine("# wellknown")
	g.genWellKnown(fullName)

	return nil
}

func (g *Gen) generateMessageFieldAccessor(field fieldInfo) {
	if field.Field.Options.GetDeprecated() {
		g.W.WriteLine("@deprecated")
	}
	if field.HasDefault {
		g.W.WriteLinef("def %s %s {", field.Name(), field.CollectionType())
		g.W.WriteLinef("return %s.unwrapOr(%s)", field.PrivateName(), field.DefaultValue())
		g.W.WriteLine("}")
		g.W.WriteLine("")
	} else {
		g.W.WriteLinef("def %s %s {", field.Name(), field.WrappedSkewType())
		g.W.WriteLinef("return %s", field.PrivateName())
		g.W.WriteLine("}")
		g.W.WriteLine("")
	}

	if !field.Repeated {
		g.W.WriteLine("@prefer")
		if field.Field.Options.GetDeprecated() {
			g.W.WriteLine("@deprecated")
		}
		g.W.WriteLinef("def %s=(value %s) {", field.Name(), field.CollectionType())
		g.W.WriteLinef("%s = some<%s>(value)", field.PrivateName(), field.CollectionType())
		g.W.WriteLine("}")
		g.W.WriteLine("")
	}

	if field.Field.Options.GetDeprecated() {
		g.W.WriteLine("@deprecated")
	}
	g.W.WriteLinef("def %s=(value %s) {", field.Name(), field.WrappedSkewType())
	g.W.WriteLinef("%s = value", field.PrivateName())
	g.W.WriteLine("}")
	g.W.WriteLine("")

	if !field.Repeated {
		if field.Field.Options.GetDeprecated() {
			g.W.WriteLine("@deprecated")
		}
		g.W.WriteLinef("def has%s bool {", title(field.Name()))
		g.W.WriteLinef("return %s.isSome", field.PrivateName())
		g.W.WriteLine("}")
		g.W.WriteLine("")
	}
}

func (g *Gen) generateMessageFieldMarshaller(field fieldInfo) {
	val := fmt.Sprintf("%s.unwrapUnchecked", field.PrivateName())

	if field.Repeated {
		g.W.WriteLinef("if %s.count > 0 {", field.PrivateName())
		if field.TypeInfo.Packable() {
			g.W.WriteLinef("if %s.count == 1 {", field.PrivateName())
			val = field.PrivateName() + "[0]"
		} else {
			g.W.WriteLinef("for item in %s {", field.PrivateName())
			val = "item"
		}
	} else {
		g.W.WriteLinef("if %s.isSome {", field.PrivateName())
	}
	if field.TypeInfo.Enum {
		g.W.WriteLinef("writer.writeVarInt(%d, %s)", field.Field.GetNumber(), val)
	} else if field.TypeInfo.SkewType == "" {
		g.W.WriteLinef("writer.writeBytes(%d, %s.marshal)", field.Field.GetNumber(), val)
	} else {
		g.W.WriteLinef("writer.write%s(%d, %s)", field.Serialize(), field.Field.GetNumber(), field.Encode(val))
	}

	if field.Repeated {
		if field.TypeInfo.Packable() {
			g.W.WriteLinef("} else {")
			g.W.WriteLinef("var buffer = proto.Writer.new")
			g.W.WriteLinef("for item in %s {", field.PrivateName())
			if field.TypeInfo.Enum {
				g.W.WriteLinef("buffer.writeVarInt(%s)", field.Encode("item"))
			} else {
				g.W.WriteLinef("buffer.write%s(%s)", field.Serialize(), field.Encode("item"))
			}
			g.W.WriteLine("}")
			g.W.WriteLinef("writer.writeBytes(%d, buffer.buffer)", field.Field.GetNumber())
		}
		g.W.WriteLine("}")
	}
	g.W.WriteLine("}")
}

func (g *Gen) generateMessageFieldObjectMarshaller(field fieldInfo) {
	if g.options.RedactObjectUsingDebugRedact && field.Field.GetOptions().GetDebugRedact() {
		return
	}

	accessor := "." + field.Name()
	if !isValidSkewIdentifier(accessor[1:]) {
		accessor = fmt.Sprintf("[%q]", accessor[1:])
	}

	value := field.PrivateName()
	if !field.Repeated {
		value += ".unwrapUnchecked"
	}

	modifier := ""

	if field.TypeInfo.Enum {
		modifier += ".toString"
	} else if field.TypeInfo.SkewType == "" {
		modifier += ".marshalObject"
	}

	if field.Repeated {
		value = fmt.Sprintf("%s.map<dynamic>((item) => item%s)", value, modifier)
	} else {
		value += modifier
		g.W.WriteLinef("if %s.isSome {", field.PrivateName())
	}
	g.W.WriteLinef("result%s = %s", accessor, value)
	if !field.Repeated {
		g.W.WriteLine("}")
	}
}

func (g *Gen) generateMessageFieldUnmarshaller(field fieldInfo, name string, oneOfs []*oneOfInfo) {
	g.W.WriteLinef("case %d {", field.Field.GetNumber())

	value := field.Decode(fmt.Sprintf("reader.read%s", field.Serialize()))
	if field.Repeated {
		if field.TypeInfo.Packable() {
			g.W.WriteLine("if tag.tag == .LEN {")
			g.W.WriteLine("var buffer = proto.Reader.new(reader.readBytes)")
			g.W.WriteLine("while !buffer.done {")
			g.W.WriteLinef("message.%s.append(%s)", field.Name(), strings.ReplaceAll(value, "reader.", "buffer."))
			g.W.WriteLine("}")
			g.W.WriteLine("} else {")
			g.W.WriteLinef("assert(tag.tag == .%s)", field.TypeInfo.WireType())
			g.W.WriteLinef("message.%s.append(%s)", field.PrivateName(), value)
			g.W.WriteLine("}")
		} else {
			g.W.WriteLinef("assert(tag.tag == .%s)", field.TypeInfo.WireType())
			g.W.WriteLinef("message.%s.append(%s)", field.PrivateName(), value)
		}
	} else {
		g.W.WriteLinef("assert(tag.tag == .%s)", field.TypeInfo.WireType())
		value = fmt.Sprintf("some<%s>(%s)", field.CollectionType(), value)
		g.W.WriteLinef("message.%s = %s", field.PrivateName(), value)
	}

	if field.Field.OneofIndex != nil {
		oneOf := oneOfs[*field.Field.OneofIndex]
		g.W.WriteLinef("message._oneof_%d = %s.%s.%s", *field.Field.OneofIndex, name, oneOf.Name, title(field.Name()))
	}

	g.W.WriteLine("}")
}

type fieldInfo struct {
	G          *Gen
	Field      *descriptorpb.FieldDescriptorProto
	TypeInfo   Type
	SkewType   string
	Repeated   bool
	HasDefault bool
}

func (f fieldInfo) Name() string {
	if f.Field.GetJsonName() != "" {
		return f.Field.GetJsonName()
	}
	return f.Field.GetName()
}

func (f fieldInfo) PrivateName() string {
	return "__" + f.Name()
}

func (f fieldInfo) CollectionType() string {
	if f.Repeated {
		return "List<" + f.SkewType + ">"
	}
	return f.SkewType
}

func (f fieldInfo) WrappedSkewType() string {
	if f.Repeated {
		return f.CollectionType()
	}
	return "Option<" + f.CollectionType() + ">"
}

func (f fieldInfo) Initializer() string {
	if f.Repeated {
		return f.CollectionType() + ".new"
	}
	return "none<" + f.CollectionType() + ">()"
}

func (f fieldInfo) DefaultValue() string {
	defaultValue := f.Field.GetDefaultValue()
	if f.TypeInfo.SkewType == "string" {
		return strconv.Quote(defaultValue)
	} else if f.TypeInfo.Enum {
		// very cursed, hopefully this works
		enumName := strings.TrimPrefix(f.Field.GetTypeName(), ".")
		enumNameParts := strings.Split(enumName, ".")
		return fmt.Sprintf("%s.%s", f.SkewType, f.G.enumValueName(enumNameParts[len(enumNameParts)-1], defaultValue))
	}

	return defaultValue
}

func (f fieldInfo) Serialize() string {
	if f.TypeInfo.Fixed > 0 {
		return "Int" + fmt.Sprintf("%d", f.TypeInfo.Fixed*8)
	}
	if f.TypeInfo.SkewType == "string" {
		return "String"
	}
	if f.TypeInfo.Bytes {
		return "Bytes"
	}
	return "VarInt"
}

func (f fieldInfo) Encode(inner string) string {
	// if f.TypeInfo.Enum {
	// 	return fmt.Sprintf("%s as int", inner)
	// }
	if f.TypeInfo.Encoder != "" {
		return fmt.Sprintf("proto.internal_encoding.%s.encode(%s)", f.TypeInfo.Encoder, inner)
	}
	return inner
}

func (f fieldInfo) Decode(inner string) string {
	if f.TypeInfo.Enum {
		return fmt.Sprintf("%s as %s", inner, f.SkewType)
	}
	if f.TypeInfo.Message {
		return fmt.Sprintf("%s.unmarshal(%s)", f.SkewType, inner)
	}
	if f.TypeInfo.Encoder != "" {
		return fmt.Sprintf("proto.internal_encoding.%s.decode(%s)", f.TypeInfo.Encoder, inner)
	}
	return inner
}

type oneOfInfo struct {
	Name   string
	Index  int
	Fields []fieldInfo
}
