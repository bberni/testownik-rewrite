import { describe, it, expect } from 'vitest'
import { parseQuestionFile, parseQuestions } from '@/domain/parseQuestionFile'

function xQuestion(mask: string, content: string, answers: string[]): string {
  return [mask, content, ...answers].join('\n')
}

function yQuestion(
  header: string,
  content: string,
  answerRows: string[],
): string {
  return [header, content, ...answerRows].join('\n')
}

describe('parseQuestionFile - X format (single/multiple-choice)', () => {
  it('parses basic X question with text content', () => {
    const text = xQuestion('X101', 'What is 2+2?', [
      '3',
      '4',
      '5',
    ])
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('single')
    expect(result!.contentType).toBe('text')
    expect(result!.content).toBe('What is 2+2?')
    expect(result!.tag).toBe('test.txt')
  })

  it('parses correct answer mask correctly', () => {
    const text = xQuestion('X1001', 'Question?', [
      'A',
      'B',
      'C',
      'D',
    ])
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    const answers = result!.answers as { isCorrect: boolean }[]
    expect(answers[0]!.isCorrect).toBe(true)
    expect(answers[1]!.isCorrect).toBe(false)
    expect(answers[2]!.isCorrect).toBe(false)
    expect(answers[3]!.isCorrect).toBe(true)
  })

  it('parses multiple correct answers', () => {
    const text = xQuestion('X111', 'Select all prime numbers', [
      '2',
      '6',
      '7',
    ])
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    const answers = result!.answers as { isCorrect: boolean }[]
    expect(answers[0]!.isCorrect).toBe(true)
    expect(answers[1]!.isCorrect).toBe(true)
    expect(answers[2]!.isCorrect).toBe(true)
  })

  it('parses image question body', () => {
    const text = xQuestion('X10', '[img]photo.jpg[/img]', [
      'Yes',
      'No',
    ])
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    expect(result!.contentType).toBe('image')
    expect(result!.content).toBe('photo.jpg')
  })

  it('parses image answers', () => {
    const text = xQuestion('X10', 'What is this?', [
      '[img]cat.jpg[/img]',
      '[img]dog.jpg[/img]',
    ])
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    const answers = result!.answers as {
      type: string
      content: string
    }[]
    expect(answers[0]!.type).toBe('image')
    expect(answers[0]!.content).toBe('cat.jpg')
    expect(answers[1]!.type).toBe('image')
    expect(answers[1]!.content).toBe('dog.jpg')
  })

  it('filters blank answer lines', () => {
    const text = xQuestion('X101', 'Question?', [
      '',
      '  ',
      'Answer 1',
      '',
      'Answer 2',
      '  ',
      'Answer 3',
    ])
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    expect(result!.answers).toHaveLength(3)
  })

  it('returns correct answer IDs starting from 0 (X101 mask)', () => {
    const text = xQuestion('X101', 'Q', ['A', 'B', 'C'])
    const result = parseQuestionFile('test.txt', text)
    const answers = result!.answers as {
      id: number
      isCorrect: boolean
    }[]
    expect(answers[0]!.id).toBe(0)
    expect(answers[1]!.id).toBe(1)
    expect(answers[2]!.id).toBe(2)
  })

  it('returns correct answer IDs starting from 0 (X001 mask)', () => {
    const text = xQuestion('X001', 'Q', ['A', 'B', 'C'])
    const result = parseQuestionFile('test.txt', text)
    const answers = result!.answers as {
      id: number
      isCorrect: boolean
    }[]
    expect(answers[0]!.id).toBe(0)
    expect(answers[1]!.id).toBe(1)
    expect(answers[2]!.id).toBe(2)
  })
})

describe('parseQuestionFile - Y format (select)', () => {
  it('parses basic select question', () => {
    const text = yQuestion(
      'Y21',
      'Mój wybór to {wybór 1}.',
      ['Opcja A;;Opcja B;;Opcja C'],
    )
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('select')
    expect(result!.contentType).toBe('text')
  })

  it('parses select question with multiple selects', () => {
    const text = yQuestion(
      'Y213',
      'Wybieram {wybór 1} oraz {wybór 2}.',
      ['A;;B;;C', 'X;;Y;;Z'],
    )
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    const answers = result!.answers as {
      id: number
      correctOptionId: number
      options: { id: number; content: string; isCorrect: boolean }[]
    }[]
    expect(answers).toHaveLength(2)
    expect(answers[0]!.correctOptionId).toBe(0) // '1' - 1 = 0
    expect(answers[1]!.correctOptionId).toBe(2) // '3' - 1 = 2
  })

  it('parses correct option IDs as zero-indexed', () => {
    const text = yQuestion(
      'Y21',
      '{wybór 1}',
      ['Pierwsza;;Druga;;Trzecia'],
    )
    const result = parseQuestionFile('test.txt', text)
    const answers = result!.answers as {
      correctOptionId: number
      options: { id: number }[]
    }[]
    // First line is "Y21" → chars after position 1 are [2?, 1?]
    // substring(2) = "1" → parseInt - 1 = 0
    expect(answers[0]!.correctOptionId).toBe(0)
    expect(answers[0]!.options).toHaveLength(3)
  })

  it('parses placeholder content with selectId', () => {
    const text = yQuestion(
      'Y21',
      'przed {wybór 1} po {wybór 2} koniec',
      ['A;;B', 'C;;D'],
    )
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()

    const content = result!.content as (string | { selectId: number; visibleContent: string })[]
    expect(content).toHaveLength(5)
    expect(typeof content[0]).toBe('string')
    expect((content[0] as string).trim()).toBe('przed')
    expect((content[1] as { selectId: number }).selectId).toBe(0)
    expect(typeof content[2]).toBe('string')
    expect((content[3] as { selectId: number }).selectId).toBe(1)
    expect(typeof content[4]).toBe('string')
  })

  it('filters empty options split by ;;', () => {
    const text = yQuestion(
      'Y21',
      '{wybór 1}',
      ['A;;;;B;;;C;'],
    )
    const result = parseQuestionFile('test.txt', text)
    const answers = result!.answers as {
      options: unknown[]
    }[]
    expect(answers[0]!.options).toHaveLength(3)
  })

  it('parses Y question with image question body', () => {
    const text = yQuestion(
      'Y21',
      '[img]diagram.jpg[/img] {wybór 1}',
      ['Opcja A;;Opcja B'],
    )
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    expect(result!.contentType).toBe('image')
    const content = result!.content
    expect(Array.isArray(content)).toBe(true)
    expect(content).toHaveLength(1)
    expect(content[0]).toBe('diagram.jpg')
  })
})

describe('parseQuestionFile - edge cases', () => {
  it('returns null for files with fewer than 3 lines', () => {
    expect(parseQuestionFile('short.txt', 'X10\nQuestion?')).toBeNull()
  })

  it('parses question with Polish characters', () => {
    const text = xQuestion('X10', 'Czy pytania będą łatwe?', [
      'Tak',
      'Nie',
    ])
    const result = parseQuestionFile('001.txt', text)
    expect(result).not.toBeNull()
    expect(result!.content).toBe('Czy pytania będą łatwe?')
  })

  it('parses question without any correct answers', () => {
    const text = xQuestion('X000', 'All wrong?', ['A', 'B', 'C'])
    const result = parseQuestionFile('test.txt', text)
    expect(result).not.toBeNull()
    const answers = result!.answers as { isCorrect: boolean }[]
    expect(answers.every((a) => !a.isCorrect)).toBe(true)
  })
})

describe('parseQuestions', () => {
  it('filters out null results', () => {
    const results = parseQuestions([
      { filename: 'good.txt', text: 'X10\nQ?\nYes\nNo' },
      { filename: 'bad.txt', text: 'Q?' },
    ])
    expect(results).toHaveLength(1)
    expect(results[0]!.tag).toBe('good.txt')
  })

  it('parses mixed X and Y questions', () => {
    const xText = xQuestion('X10', 'X question?', ['A', 'B'])
    const yText = yQuestion(
      'Y21',
      '{wybór 1} jest wybrany',
      ['Opcja 1;;Opcja 2'],
    )
    const results = parseQuestions([
      { filename: 'x.txt', text: xText },
      { filename: 'y.txt', text: yText },
    ])
    expect(results).toHaveLength(2)
    expect(results[0]!.type).toBe('single')
    expect(results[1]!.type).toBe('select')
  })
})
