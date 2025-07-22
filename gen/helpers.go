package gen

import "strings"

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
