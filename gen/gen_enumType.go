package gen

import (
	"fmt"
	"math"
	"slices"
	"strings"

	"google.golang.org/protobuf/types/descriptorpb"
)

func (g *Gen) generateEnumType(enumType *descriptorpb.EnumDescriptorProto) error {
	name := enumType.GetName()
	if name == "" {
		return fmt.Errorf("enum type has no name")
	}

	// we need to determine if this is a flags enum (bitwise flags) or a regular enum
	// by checking if every value is a power of two and we see at least 4 (eg 3 is missing)
	isFlags := true
	seen := 0
	for _, value := range enumType.Value {
		n := value.GetNumber()
		if n < 0 {
			return fmt.Errorf("enum value %s has negative number %d", value.GetName(), n)
		}
		if math.Mod(math.Log2(float64(n)), 1) != 0 {
			isFlags = false
			break
		}
		seen++
	}

	if isFlags && seen < 4 {
		isFlags = false // we need at least 4 values to consider it a flags enum
	}

	if enumType.Options.GetDeprecated() {
		g.W.WriteLine("@deprecated")
	}

	nextValue := int32(0)
	if isFlags {
		g.W.WriteLine("# bitwise flags")
		g.W.WriteLinef("flags %s {", name)
		nextValue = 1
	} else {
		g.W.WriteLine("# enum values")
		g.W.WriteLinef("enum %s {", name)
	}

	orderedValues := enumType.Value
	slices.SortFunc(orderedValues, func(a, b *descriptorpb.EnumValueDescriptorProto) int {
		return int(a.GetNumber()) - int(b.GetNumber())
	})

	for _, value := range orderedValues {
		n := value.GetNumber()
		// skew only has "implicit" numbering for enums, so we need to add
		// the missing values explicitly if they are not present in the enum
		for n > nextValue {
			g.W.WriteLinef("    __unused_%d", nextValue)
			if isFlags {
				nextValue *= 2 // next power of two
			} else {
				nextValue++ // next integer
			}
		}
		if value.Options.GetDeprecated() {
			g.W.WriteLine("@deprecated")
		}
		g.W.WriteLinef("    %s", g.enumValueName(name, value.GetName()))
		if isFlags {
			nextValue *= 2 // next power of two
		} else {
			nextValue++ // next integer
		}
	}

	g.W.WriteLine("}")

	return nil
}

func (g *Gen) enumValueName(name string, value string) string {
	if !g.options.StripEnumPrefix {
		return value
	}
	enumPrefix := screamingCase(name)
	return strings.TrimPrefix(value, enumPrefix+"_")
}
