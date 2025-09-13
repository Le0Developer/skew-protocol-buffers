package gen

import (
	"fmt"
	"strings"

	"google.golang.org/protobuf/types/descriptorpb"
)

// https://protobuf.dev/reference/cpp/api-docs/google.protobuf.descriptor.pb/
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

	g.namespaces = append(g.namespaces, packageName)
	g.W.WriteLinef("namespace %s {", strings.Join(g.namespaces, "."))

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

	if g.options.GRPC && len(descriptor.Service) > 0 {
		g.W.WriteLine("")
		g.W.WriteLine("# services")
		for _, service := range descriptor.Service {
			if err := g.generateService(service); err != nil {
				return fmt.Errorf("error generating service %s: %w", service.GetName(), err)
			}
		}
	}

	g.W.WriteLine("}")
	g.namespaces = g.namespaces[:len(g.namespaces)-1]

	return nil
}
