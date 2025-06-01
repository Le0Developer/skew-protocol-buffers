package gen

import "strings"

func title(title string) string {
	if title == "" {
		return ""
	}
	return strings.ToUpper(title[:1]) + title[1:]
}
