package gen

import (
	"fmt"

	"google.golang.org/protobuf/types/descriptorpb"
)

func (g *Gen) generateFile(descriptor *descriptorpb.FileDescriptorProto) error {
	name := descriptor.GetName()
	if name == "" {
		return fmt.Errorf("file descriptor has no name")
	}

	packageName := descriptor.GetPackage()
	if packageName == "" {
		return fmt.Errorf("file descriptor has no package")
	}

	g.W.WriteLinef("# Generated file: %s (%s)", name, packageName)
	if descriptor.Options.GetDeprecated() {
		g.W.WriteLine("@deprecated")
	}
	g.W.WriteLinef("namespace %s {", packageName)

	g.W.WriteLine("# message types")
	for _, messageType := range descriptor.MessageType {
		if err := g.generateMessageType(packageName, messageType); err != nil {
			return fmt.Errorf("error generating message type %s: %w", messageType.GetName(), err)
		}
	}

	g.W.WriteLine("")
	g.W.WriteLine("# enum types")
	for _, enumType := range descriptor.EnumType {
		if err := g.generateEnumType(enumType); err != nil {
			return fmt.Errorf("error generating enum type %s: %w", enumType.GetName(), err)
		}
	}

	g.W.WriteLine("}")

	return nil
}
