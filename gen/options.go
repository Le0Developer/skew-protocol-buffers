package gen

import (
	"fmt"
	"strings"
)

type Options struct {
	// PreserveUnknownFields indicates whether to preserve unknown fields in the generated code.
	// By default, this is set to true.
	// This means that when parsing a protobuf message, any fields that are not recognized will be recorded
	// and then preserved when you marshal the message back to protobuf.
	// If this behavior is not required (e.g. an older version will never read and write back a message created by a newer version),
	// you can set this to false to reduce the size of the generated code.
	PreserveUnknownFields bool

	// ShuffleFields indicates whether to shuffle the order of fields in the generated code.
	// This can be useful for testing purposes to ensure that the code does not rely on field order.
	ShuffleFields bool

	// StripEnumPrefix indicates whether to strip the prefix from enum values in the generated code.
	// This is useful when you want to use enum values without the prefix in your code.
	// Due to C++ convetions, protobuf enum values are prefixed with the enum name.
	// For example, if you have an enum `Color` with a value `RED`, the generated code will have `COLOR_RED`.
	// However, in Skew this is not necessary as enums are properly namespaced.
	// If this is set to true, the generated code will use `RED` instead of `COLOR_RED`.
	// The heuristic is that we convert the enum name to uppercase and then strip it from the enum value.
	// NOTE: When marshalling to JSON, the enum value will be STRIPPED OF THE PREFIX. This is technically against the protobuf spec,
	// but that's just how the toString method of enums works in Skew. The marshalJSON method is not intended to be ProtoJSON compatible.
	StripEnumPrefix bool

	// NamespacePrefix is the prefix to use for the generated code's namespace.
	// For example you might want to put all protobuf messages in a `pb` namespace.
	// NOTE: please don't use the `proto` namespace as it's used by the protobuf runtime
	// and might cause conflicts. We recommend using `pb` instead.
	NamespacePrefix string

	// Use debug_redact to hide from marshalJSON
	RedactJSONUsingDebugRedact bool
}

func defaultOptions() Options {
	return Options{
		PreserveUnknownFields:      true,
		ShuffleFields:              true,
		StripEnumPrefix:            true,
		RedactJSONUsingDebugRedact: false,
	}
}

func (o *Options) parseOptions(opt string) error {
	fields := map[string]any{
		"PreserveUnknownFields":      &o.PreserveUnknownFields,
		"ShuffleFields":              &o.ShuffleFields,
		"StripEnumPrefix":            &o.StripEnumPrefix,
		"RedactJSONUsingDebugRedact": &o.RedactJSONUsingDebugRedact,
		"NamespacePrefix":            &o.NamespacePrefix,
	}

	args := strings.Split(opt, ",")
	for _, arg := range args {
		args := strings.Split(strings.TrimSpace(arg), "=")
		if len(args) == 1 {
			args = append(args, "yes")
		} else if len(args) != 2 {
			return fmt.Errorf("invalid option format: %s, expected key=value", arg)
		}

		field, ok := fields[args[0]]
		if !ok {
			return fmt.Errorf("unknown option: %s", args[0])
		}

		switch v := field.(type) {
		case *bool:
			value, err := o.coerceToBool(args[1])
			if err != nil {
				return err
			}
			*v = value
		case *string:
			*v = args[1]
		default:
			panic(fmt.Sprintf("unexpected type for option %s: %T", args[0], v))
		}
	}
	return nil
}

func (o *Options) coerceToBool(v string) (bool, error) {
	switch strings.ToLower(v) {
	case "true", "yes", "1", "y":
		return true, nil
	case "false", "no", "0", "n":
		return false, nil
	default:
		return false, fmt.Errorf("invalid boolean value: %s, expected true/false or yes/no", v)
	}
}
