import type {
  Question,
  QuestionContent,
  SingleQuestionAnswer,
  SelectQuestionAnswer,
  SelectOption,
  SelectPlaceholder,
} from './quizTypes'

function getLinkToImage(line: string): string {
  return line.split('[img]').pop()!.split('[/img]').shift() ?? ''
}

function parseCorrectMask(line: string): number[] {
  return line
    .trim()
    .substring(1)
    .split('')
    .map((char, index) => ({ char, index }))
    .filter((i) => i.char === '1')
    .map((i) => i.index)
}

function readXQuestion(filename: string, lines: string[]): Question | null {
  const correctAnswers = parseCorrectMask(lines[0]!)
  const questionType = lines[1]!.trim().startsWith('[img]') ? 'image' : 'text'
  const questionContent =
    questionType === 'image' ? getLinkToImage(lines[1]!) : lines[1]!

  const answers: SingleQuestionAnswer[] = lines
    .slice(2)
    .filter(
      (l) =>
        l.replace(/^\s*/, '').replace(/\s*$/, '').length !== 0,
    )
    .map((line, index) => {
      const trimmed = line.trim()
      const isImage = trimmed.startsWith('[img]')
      return {
        id: index,
        type: isImage ? 'image' : 'text',
        content: isImage ? getLinkToImage(trimmed) : trimmed,
        isCorrect: correctAnswers.includes(index),
      }
    })

  return {
    tag: filename,
    contentType: questionType,
    content: questionContent,
    type: 'single',
    answers,
  }
}

const PLACEHOLDER_RE = /\{wybór [1-9][0-9]*\}/

function parseYContent(
  line: string,
): (string | SelectPlaceholder)[] {
  const parts = line.split(/(\{wybór [1-9][0-9]*\})/)
  return parts
    .filter((p) => p.length > 0)
    .map((l) => {
      if (PLACEHOLDER_RE.test(l)) {
        return {
          selectId: parseInt(l.replace('{wybór ', '').replace('}', ''), 10) - 1,
          visibleContent: '',
        }
      }
      return l
    })
}

function readYQuestion(filename: string, lines: string[]): Question | null {
  const correctAnswersOfSelects = lines[0]!
    .trim()
    .substring(2)
    .split('')
    .map((char) => parseInt(char, 10) - 1)

  const questionType = lines[1]!.trim().startsWith('[img]') ? 'image' : 'text'

  const questionContent: QuestionContent =
    questionType === 'image'
      ? [getLinkToImage(lines[1]!)]
      : parseYContent(lines[1]!)

  const answers: SelectQuestionAnswer[] = lines
    .slice(2)
    .filter(
      (l) =>
        l.replace(/^\s*/, '').replace(/\s*$/, '').length !== 0,
    )
    .map((line, selectIndex) => {
      const options: SelectOption[] = line
        .trim()
        .split(';;')
        .filter((x) => x)
        .map((o, answerIndex) => {
          const isImage = o.startsWith('[img]')
          return {
            id: answerIndex,
            type: isImage ? 'image' : 'text',
            content: isImage ? getLinkToImage(o) : o,
            isCorrect:
              correctAnswersOfSelects[selectIndex] === answerIndex,
          }
        })

      return {
        id: selectIndex,
        correctOptionId: correctAnswersOfSelects[selectIndex]!,
        options,
      }
    })

  return {
    tag: filename,
    contentType: questionType,
    content: questionContent,
    type: 'select',
    answers,
  }
}

/**
 * Parses the decoded text of a question file into a Question object.
 * The first line determines the format:
 *   - Starts with 'X' → single (multiple-choice)
 *   - Otherwise → select (fill-in-the-blank with wybór placeholders)
 */
export function parseQuestionFile(
  filename: string,
  text: string,
): Question | null {
  const lines = text.split('\n')
  if (lines.length < 3) {
    return null
  }

  const firstLine = lines[0]!.trim()
  if (firstLine.startsWith('X')) {
    return readXQuestion(filename, lines)
  }
  return readYQuestion(filename, lines)
}

/**
 * Parses multiple question files at once, filtering out failures.
 */
export function parseQuestions(
  files: { filename: string; text: string }[],
): Question[] {
  return files
    .map((f) => parseQuestionFile(f.filename, f.text))
    .filter((q): q is Question => q !== null)
}
