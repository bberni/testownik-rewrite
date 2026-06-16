import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '@/ui/components/shared/Modal.vue'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    mount(Modal, { props: { open: false } })
    expect(document.body.querySelector('.modal-mask')).toBeNull()
  })

  it('renders when open', () => {
    mount(Modal, { props: { open: true } })
    expect(document.body.querySelector('.modal-mask')).toBeTruthy()
  })

  it('renders title prop', () => {
    mount(Modal, { props: { open: true, title: 'Test Title' } })
    expect(document.body.textContent).toContain('Test Title')
  })

  it('renders default slot content', () => {
    mount(Modal, {
      props: { open: true },
      slots: { default: '<p>Body content</p>' },
    })
    expect(document.body.textContent).toContain('Body content')
  })

  it('renders footer slot', () => {
    mount(Modal, {
      props: { open: true },
      slots: { footer: '<button>Footer Btn</button>' },
    })
    expect(document.body.textContent).toContain('Footer Btn')
  })

  it('teleports away from component root', () => {
    const wrapper = mount(Modal, { props: { open: true } })
    expect(wrapper.find('.modal-mask').exists()).toBe(false)
  })
})
