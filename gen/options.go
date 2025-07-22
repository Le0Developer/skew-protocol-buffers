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
}

func defaultOptions() Options {
	return Options{
		PreserveUnknownFields: true,
		ShuffleFields:         true,
	}
}

func (o *Options) parseOptions(opt string) error {
	fields := map[string]*bool{
		"PreserveUnknownFields": &o.PreserveUnknownFields,
		"ShuffleFields":         &o.ShuffleFields,
	}

	args := strings.Split(opt, ",")
	for _, arg := range args {
		newValue := true
		if strings.HasPrefix(arg, "-") {
			newValue = false
			arg = strings.TrimPrefix(arg, "-")
		}

		if field, ok := fields[arg]; ok {
			*field = newValue
		} else {
			return fmt.Errorf("unknown option: %s", arg)
		}
	}
	return nil
}
