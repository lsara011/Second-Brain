import { Fragment, type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/context/AppTheme';

type Block =
  | { type: 'code'; content: string; language: string }
  | { type: 'line'; content: string };

export function SafeMarkdown({ content }: { content: string }) {
  const { colors } = useAppTheme();
  const blocks = parseBlocks(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <View key={index} style={[styles.codeContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {!!block.language && (
                <Text style={[styles.codeLanguage, { color: colors.textSecondary }]}>{block.language}</Text>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.codeScroll}>
                <Text selectable style={[styles.codeBlock, { color: colors.text }]}>{block.content}</Text>
              </ScrollView>
            </View>
          );
        }

        const line = block.content;
        if (!line.trim()) return <View key={index} style={styles.spacer} />;

        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length;
          return (
            <Text key={index} style={[styles.heading, level === 1 ? styles.heading1 : level === 2 ? styles.heading2 : styles.heading3, { color: colors.text }]}>
              {renderInline(heading[2], colors.text, colors.primary, colors.surfaceSecondary)}
            </Text>
          );
        }

        const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
        if (unordered) {
          return (
            <View key={index} style={styles.listRow}>
              <Text style={[styles.listMarker, { color: colors.primary }]}>•</Text>
              <Text style={[styles.body, styles.listText, { color: colors.text }]}>{renderInline(unordered[1], colors.text, colors.primary, colors.surfaceSecondary)}</Text>
            </View>
          );
        }

        const ordered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
        if (ordered) {
          return (
            <View key={index} style={styles.listRow}>
              <Text style={[styles.numberMarker, { color: colors.primary }]}>{ordered[1]}.</Text>
              <Text style={[styles.body, styles.listText, { color: colors.text }]}>{renderInline(ordered[2], colors.text, colors.primary, colors.surfaceSecondary)}</Text>
            </View>
          );
        }

        const quote = line.match(/^>\s?(.*)$/);
        if (quote) {
          return (
            <View key={index} style={[styles.quote, { backgroundColor: colors.surfaceSecondary, borderLeftColor: colors.primary }]}>
              <Text style={[styles.body, { color: colors.text }]}>{renderInline(quote[1], colors.text, colors.primary, colors.surfaceSecondary)}</Text>
            </View>
          );
        }

        if (/^([-*_])\1\1+$/.test(line.trim())) {
          return <View key={index} style={[styles.divider, { backgroundColor: colors.border }]} />;
        }

        return (
          <Text key={index} style={[styles.body, { color: colors.text }]}>
            {renderInline(line, colors.text, colors.primary, colors.surfaceSecondary)}
          </Text>
        );
      })}
    </View>
  );
}

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const codeLines: string[] = [];
  let inCode = false;
  let language = '';

  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', content: codeLines.join('\n'), language });
        codeLines.length = 0;
        language = '';
        inCode = false;
      } else {
        inCode = true;
        language = line.slice(3).trim().slice(0, 30);
      }
      continue;
    }

    if (inCode) codeLines.push(line);
    else blocks.push({ type: 'line', content: line });
  }

  if (inCode) blocks.push({ type: 'code', content: codeLines.join('\n'), language });
  return blocks;
}

function renderInline(text: string, textColor: string, linkColor: string, codeBackground: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    const token = match[0];

    if (token.startsWith('**')) {
      nodes.push(<Text key={start} style={styles.bold}>{token.slice(2, -2)}</Text>);
    } else if (token.startsWith('`')) {
      nodes.push(<Text key={start} style={[styles.inlineCode, { color: textColor, backgroundColor: codeBackground }]}>{token.slice(1, -1)}</Text>);
    } else if (token.startsWith('*')) {
      nodes.push(<Text key={start} style={styles.italic}>{token.slice(1, -1)}</Text>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (link) {
        nodes.push(
          <Text
            key={start}
            accessibilityRole="link"
            onPress={() => void Linking.openURL(link[2])}
            style={[styles.link, { color: linkColor }]}
          >
            {link[1]}
          </Text>
        );
      }
    }
    cursor = start + token.length;
  }

  if (cursor < text.length) nodes.push(<Fragment key={cursor}>{text.slice(cursor)}</Fragment>);
  return nodes;
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  body: { fontSize: 16, lineHeight: 25, marginBottom: 7 },
  heading: { fontWeight: '800', marginTop: 5, marginBottom: 9 },
  heading1: { fontSize: 24, lineHeight: 31 },
  heading2: { fontSize: 21, lineHeight: 28 },
  heading3: { fontSize: 18, lineHeight: 25 },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
  link: { textDecorationLine: 'underline' },
  inlineCode: { fontFamily: 'monospace', fontSize: 14 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  listMarker: { width: 20, fontSize: 20, lineHeight: 24, fontWeight: '800' },
  numberMarker: { width: 28, fontSize: 15, lineHeight: 25, fontWeight: '800' },
  listText: { flex: 1, marginBottom: 0 },
  quote: { marginVertical: 6, paddingHorizontal: 12, paddingVertical: 8, borderLeftWidth: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  spacer: { height: 7 },
  codeContainer: { marginVertical: 7, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  codeLanguage: { paddingHorizontal: 12, paddingTop: 8, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  codeScroll: { padding: 12 },
  codeBlock: { fontFamily: 'monospace', fontSize: 14, lineHeight: 21 },
});
