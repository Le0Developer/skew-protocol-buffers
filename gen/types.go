package gen

import (
	"google.golang.org/protobuf/types/descriptorpb"
)

var (
	typeMap = map[descriptorpb.FieldDescriptorProto_Type]Type{
		descriptorpb.FieldDescriptorProto_TYPE_DOUBLE:  {SkewType: "double", Encoder: "Float", Fixed: 8},
		descriptorpb.FieldDescriptorProto_TYPE_FLOAT:   {SkewType: "double", Encoder: "Float", Fixed: 4},
		descriptorpb.FieldDescriptorProto_TYPE_INT64:   {SkewType: "int"},
		descriptorpb.FieldDescriptorProto_TYPE_UINT64:  {SkewType: "int"}, // equivalent to int64 in skew
		descriptorpb.FieldDescriptorProto_TYPE_INT32:   {SkewType: "int"},
		descriptorpb.FieldDescriptorProto_TYPE_FIXED64: {SkewType: "int", Fixed: 8},
		descriptorpb.FieldDescriptorProto_TYPE_FIXED32: {SkewType: "int", Fixed: 4},
		descriptorpb.FieldDescriptorProto_TYPE_BOOL:    {SkewType: "bool", Encoder: "Bool"},
		descriptorpb.FieldDescriptorProto_TYPE_STRING:  {SkewType: "string", Bytes: true},
		// no GROUP support
		descriptorpb.FieldDescriptorProto_TYPE_MESSAGE:  {Message: true, Bytes: true},
		descriptorpb.FieldDescriptorProto_TYPE_BYTES:    {SkewType: "List<int>", Bytes: true},
		descriptorpb.FieldDescriptorProto_TYPE_UINT32:   {SkewType: "int", Fixed: 4}, // equivalent to int32 in skew
		descriptorpb.FieldDescriptorProto_TYPE_ENUM:     {Enum: true},
		descriptorpb.FieldDescriptorProto_TYPE_SFIXED32: {SkewType: "int", Fixed: 4, Encoder: "ZigZag"},
		descriptorpb.FieldDescriptorProto_TYPE_SFIXED64: {SkewType: "int", Fixed: 8, Encoder: "ZigZag"},
		descriptorpb.FieldDescriptorProto_TYPE_SINT32:   {SkewType: "int", Encoder: "ZigZag"},
		descriptorpb.FieldDescriptorProto_TYPE_SINT64:   {SkewType: "int", Encoder: "ZigZag"},
	}
)

type Type struct {
	SkewType string
	Encoder  string
	Fixed    int
	Bytes    bool
	Message  bool
	Enum     bool
}

func (t Type) WireType() string {
	if t.Bytes {
		return "LEN"
	} else if t.Fixed == 8 {
		return "I64"
	} else if t.Fixed == 4 {
		return "I32"
	}
	return "VARINT"
}

func (t Type) Packable() bool {
	return !t.Bytes
}
