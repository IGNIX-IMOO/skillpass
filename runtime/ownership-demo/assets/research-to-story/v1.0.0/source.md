# Research-to-Story v1.0.0

## Purpose

Turn a researched topic into a sourced brief and a short narrative without losing
the distinction between facts, interpretation, and creative framing.

## Input

```text
topic
audience
maximum_story_words
tone
required_sources
```

## Workflow

1. Define the exact research question and intended audience.
2. Gather primary or high-quality secondary sources.
3. Separate verified facts from uncertain claims.
4. Build a short factual brief with citations.
5. Identify the human tension, surprise, or decision inside the facts.
6. Produce a story that preserves the factual brief.
7. Generate one image prompt that communicates the central idea.
8. Return risks, missing evidence, and assumptions.

## Output Contract

```text
brief
key_facts[]
risks[]
content_angles[]
story
image_prompt
citations[]
```

## Quality Rules

- Never invent a source.
- Never present an inference as a verified fact.
- Keep the story consistent with the brief.
- Mark uncertainty explicitly.
- Prefer concrete scenes over generic summary language.
- Do not include private credentials or internal platform data in examples.
