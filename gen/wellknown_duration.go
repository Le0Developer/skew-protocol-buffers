package gen

import (
	_ "embed"
	"strings"
)

//go:embed wellknown_duration.sk
var wellKnownDurationSk string

func (g *Gen) genWellKnownDuration() {
	for _, line := range strings.Split(wellKnownDurationSk, "\n") {
		g.W.WriteLine(strings.TrimSpace(line))
	}
}
