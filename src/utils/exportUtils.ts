import { AnalysisResult } from '../types';

export function generateMarkdownReport(data: AnalysisResult, transcriptText?: string): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const languagesList = data.detectedLanguages
    .map((l) => `- **${l.name} (${l.code})**: ${l.percentage}% — ${l.roleInConversation}`)
    .join('\n');

  const conceptsList = data.coreConcepts
    .map(
      (c, idx) => `### ${idx + 1}. ${c.title} [${c.category}] (Relevance: ${c.relevanceScore}/100)
- **Description:** ${c.description}
${c.speakersInvolved?.length ? `- **Key Speakers:** ${c.speakersInvolved.join(', ')}` : ''}
${c.keyQuotes?.length ? `- **Representative Quote:** "${c.keyQuotes[0]}"` : ''}`
    )
    .join('\n\n');

  const relationshipsList = data.conceptualSummary.conceptRelationships
    .map(
      (r) =>
        `- **${r.sourceConceptTitle}** *[${r.relationshipType}]* -> **${r.targetConceptTitle}**: ${r.explanation}`
    )
    .join('\n');

  const causalList = data.conceptualSummary.causalChains?.length
    ? '\n\n#### Causal Dynamics & Logic Chains\n' +
      data.conceptualSummary.causalChains.map((c) => `- ${c}`).join('\n')
    : '';

  const takeawaysList = data.structuredNotes.keyTakeaways
    .map((k) => `- [${k.impactLevel.toUpperCase()}] **${k.category}:** ${k.takeaway}${k.speakerAttribution ? ` *(Speaker: ${k.speakerAttribution})*` : ''}`)
    .join('\n');

  const definitionsList = data.structuredNotes.definitions
    .map((d) => `- **${d.term}**${d.originalLanguage ? ` *(${d.originalLanguage})*` : ''}: ${d.formalDefinition}\n  - *Applied Context:* ${d.appliedContext}`)
    .join('\n\n');

  const jargonList = data.structuredNotes.technicalJargon
    .map(
      (j) =>
        `- **${j.jargon}** [${j.domain}]: ${j.standardMeaning}\n  - *Practical Implication:* ${j.practicalImplication}${j.occurrenceQuote ? `\n  - *Transcript Example:* "${j.occurrenceQuote}"` : ''}`
    )
    .join('\n\n');

  const languageNuances = data.languageInsights.contextDependentConcepts
    .map(
      (n) => `### "${n.term}" (${n.language})
- **Literal Translation:** "${n.literalTranslation}"
- **Contextual Meaning in Discussion:** ${n.contextualMeaning}
- **Cultural Nuance & Depth:** ${n.culturalNuance}
- **Why Direct Translation Fails:** ${n.whyDirectTranslationFails}
${n.strategicImpactOnDiscussion ? `- **Strategic Impact:** ${n.strategicImpactOnDiscussion}` : ''}`
    )
    .join('\n\n');

  const codeSwitching = data.languageInsights.codeSwitchingDynamics
    .map(
      (cs) =>
        `- **${cs.speaker}:** ${cs.shiftDescription} (Context: ${cs.triggerContext}) — *Reason:* ${cs.pragmaticReason}`
    )
    .join('\n');

  return `# Multilingual Discussion Intelligence Report
*Generated on ${date} by PolyglotScribe*

---

## 1. Executive Overview & Linguistic Landscape
${data.conceptualSummary.executiveSummary}

### Detected Languages
${languagesList}

---

## 2. Core Concepts
${conceptsList}

---

## 3. Conceptual Summary & Relationship Map
### Relational Synthesis
${data.conceptualSummary.relationalSynthesis}

### Key Concept Linkages
${relationshipsList}
${causalList}

---

## 4. Structured Notes
### Key Takeaways
${takeawaysList}

### Formal Definitions
${definitionsList}

### Technical Jargon & Acronym Glossary
${jargonList}

---

## 5. Language Insights & Cultural-Contextual Nuances
### Language Dynamics Overview
${data.languageInsights.overview}

### Context-Dependent Concepts
${languageNuances}

### Code-Switching & Pragmatic Triggers
${codeSwitching}

${
  transcriptText
    ? `\n---\n\n## 6. Source Transcript\n\`\`\`text\n${transcriptText}\n\`\`\``
    : ''
}
`;
}
