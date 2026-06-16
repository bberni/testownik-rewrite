import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuizCard from '@/ui/components/landing/QuizCard.vue'
import type { LibraryItem } from '@/ui/stores/quizLibrary'
import type { QuizPackage } from '@/domain/quizTypes'

function makeQuiz(overrides: Partial<QuizPackage> = {}): QuizPackage {
  return {
    schemaVersion: 1,
    id: 'quiz-1',
    name: 'Test Quiz',
    fingerprint: 'abc123',
    importedAt: 1000,
    updatedAt: 2000,
    questionCount: 42,
    questions: [],
    assets: [],
    ...overrides,
  }
}

function makeItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    quiz: makeQuiz(),
    hasSession: false,
    isComplete: false,
    lastOpenedAt: null,
    correctRatio: 0,
    learnedRatio: 0,
    ...overrides,
  }
}

describe('QuizCard', () => {
  it('renders quiz name and question count', () => {
    const item = makeItem({
      quiz: makeQuiz({ name: 'My Quiz', questionCount: 42 }),
    })
    const wrapper = mount(QuizCard, { props: { item } })
    expect(wrapper.text()).toContain('My Quiz')
    expect(wrapper.text()).toContain('42 pytań')
  })

  it('shows "Nie rozpoczęty" when no session', () => {
    const wrapper = mount(QuizCard, {
      props: { item: makeItem({ hasSession: false }) },
    })
    expect(wrapper.text()).toContain('Nie rozpoczęty')
  })

  it('shows progress when session exists', () => {
    const item = makeItem({
      hasSession: true,
      correctRatio: 0.75,
      learnedRatio: 0.5,
    })
    const wrapper = mount(QuizCard, { props: { item } })
    expect(wrapper.text()).toContain('Poprawne')
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.text()).toContain('Nauczone')
    expect(wrapper.text()).toContain('50%')
  })

  it('shows "Kontynuuj" button when session exists and not complete', () => {
    const item = makeItem({ hasSession: true, isComplete: false })
    const wrapper = mount(QuizCard, { props: { item } })
    expect(wrapper.text()).toContain('Kontynuuj')
    expect(wrapper.text()).not.toContain('Nowy')
  })

  it('shows "Nowy" button when session is complete', () => {
    const item = makeItem({ hasSession: true, isComplete: true })
    const wrapper = mount(QuizCard, { props: { item } })
    expect(wrapper.text()).toContain('Nowy')
    expect(wrapper.text()).not.toContain('Kontynuuj')
  })

  it('shows "Nowy" button when no session', () => {
    const item = makeItem({ hasSession: false })
    const wrapper = mount(QuizCard, { props: { item } })
    expect(wrapper.text()).toContain('Nowy')
  })

  it('emits continue event', async () => {
    const item = makeItem({ hasSession: true, isComplete: false })
    const wrapper = mount(QuizCard, { props: { item } })
    const btn = wrapper.find('.quiz-card__action--primary')
    await btn.trigger('click')
    expect(wrapper.emitted('continue')).toEqual([['quiz-1']])
  })

  it('emits startNew event', async () => {
    const item = makeItem({ hasSession: true, isComplete: true })
    const wrapper = mount(QuizCard, { props: { item } })
    const btn = wrapper.find('.quiz-card__action--primary')
    await btn.trigger('click')
    expect(wrapper.emitted('startNew')).toEqual([['quiz-1']])
  })

  it('emits delete event', async () => {
    const item = makeItem()
    const wrapper = mount(QuizCard, { props: { item } })
    const buttons = wrapper.findAll('.quiz-card__action')
    const deleteBtn = buttons[buttons.length - 1]!
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['quiz-1']])
  })
})
