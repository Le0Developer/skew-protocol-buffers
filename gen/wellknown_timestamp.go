package gen

import (
	_ "embed"
	"strings"
)

//go:embed wellknown_timestamp.sk
var wellKnownTimestampSk string

func (g *Gen) genWellKnownTimestamp() {
	for _, line := range strings.Split(wellKnownTimestampSk, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" && !strings.HasPrefix(trimmed, "#") {
			g.W.WriteLine(trimmed)
		}
	}
}
