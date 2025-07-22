package gen

import (
	"strings"
)

func title(title string) string {
	if title == "" {
		return ""
	}
	return strings.ToUpper(title[:1]) + title[1:]
}

func screamingCase(s string) string {
	result := ""
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' && (s[i-1] >= 'a' && s[i-1] <= 'z') {
			result += "_"
		}
		result += string(r)
	}
	return strings.ToUpper(result)
}

func isValidSkewIdentifier(s string) bool {
	if len(s) == 0 {
		return false
	}
	if (s[0] < 'a' || s[0] > 'z') && (s[0] < 'A' || s[0] > 'Z') {
		return false
	}
	for _, r := range s {
		if (r < 'a' || r > 'z') && (r < 'A' || r > 'Z') && (r < '0' || r > '9') && r != '_' {
			return false
		}
	}
	return true
}
