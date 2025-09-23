'use client'
import { useEffect } from 'react'

async function postEvent(payload: any) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      keepalive: true,
      credentials: 'include'
    })
  } catch (e) {
    console.error('Track error', e)
  }
}

export default function useClickstream(context = 'reader') {
  useEffect(() => {
    // Context mapping for descriptive descriptions
    const contextMap: Record<string, string> = {
      'reader': 'PDF Reader workspace',
      'dashboard': 'Analytics dashboard',
      'login': 'Authentication page'
    }

    // Helper function to generate descriptive descriptions
    const generateDescription = (eventName: string, component: string, context: string, metadata: any = {}) => {
      const eventDescriptions: Record<string, string> = {
        'load': `User accessed the ${contextMap[context] || context} page`,
        'scroll': `User scrolled to position ${metadata.scrollY || 0} on the ${contextMap[context] || context} page`,
        'click': `User clicked on ${component} element in the ${contextMap[context] || context}`
      }

      return eventDescriptions[eventName] || `User performed ${eventName} action in ${contextMap[context] || context}`
    }

    // send load
    postEvent({
      event_context: context,
      component: 'page',
      event_name: 'load',
      description: generateDescription('load', 'page', context),
      origin: window.location.href,
      metadata: {}
    })

    let scrollTimeout: any = null
    const onScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        postEvent({
          event_context: context,
          component: 'window',
          event_name: 'scroll',
          description: generateDescription('scroll', 'window', context, { scrollY: window.scrollY }),
          origin: window.location.href,
          metadata: { scrollY: window.scrollY }
        })
      }, 200)
    }
    
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Enhanced click description based on element type and context
      let clickDescription = generateDescription('click', target.tagName || 'unknown', context)
      
      // Add more context for specific elements
      if (target.tagName === 'BUTTON') {
        const buttonText = target.textContent?.trim() || 'button'
        clickDescription = `User clicked the "${buttonText}" button in the ${contextMap[context] || context}`
      } else if (target.tagName === 'A') {
        const linkText = target.textContent?.trim() || 'link'
        clickDescription = `User clicked the "${linkText}" link in the ${contextMap[context] || context}`
      } else if (target.tagName === 'INPUT') {
        clickDescription = `User interacted with input field in the ${contextMap[context] || context}`
      }

      // Special handling for quiz interactions
      if (target.closest('[data-quiz-level]')) {
        const quizLevel = target.closest('[data-quiz-level]')?.getAttribute('data-quiz-level')
        if (target.textContent?.includes('Retry')) {
          clickDescription = `User restarted the ${quizLevel} level Brainstellar quiz`
        } else if (target.textContent?.includes('Next') || target.textContent?.includes('Finish')) {
          clickDescription = `User progressed in the ${quizLevel} level Brainstellar quiz`
        }
      }

      // Special handling for game interactions
      if (target.closest('[data-game="clickspeed"]')) {
        if (target.textContent?.includes('Start')) {
          clickDescription = 'User started the Click Speed Game challenge'
        } else if (target.textContent?.includes('Play Again')) {
          clickDescription = 'User restarted the Click Speed Game challenge'
        }
      }

      // Special handling for PDF actions
      if (target.closest('[data-pdf-action]')) {
        const action = target.closest('[data-pdf-action]')?.getAttribute('data-pdf-action')
        if (action === 'upload') {
          clickDescription = 'User initiated PDF upload process'
        } else if (action === 'view') {
          clickDescription = 'User opened PDF in new tab for viewing'
        }
      }

      postEvent({
        event_context: context,
        component: target.tagName || 'unknown',
        event_name: 'click',
        description: clickDescription,
        origin: window.location.href,
        metadata: {
          x: (e as MouseEvent).clientX,
          y: (e as MouseEvent).clientY,
          tag: target.tagName,
          id: target.id,
          classes: target.className,
          textContent: target.textContent?.trim() || '',
          href: (target as HTMLAnchorElement).href || null,
          quizLevel: target.closest('[data-quiz-level]')?.getAttribute('data-quiz-level') || null,
          gameType: target.closest('[data-game]')?.getAttribute('data-game') || null,
          pdfAction: target.closest('[data-pdf-action]')?.getAttribute('data-pdf-action') || null
        }
      })
    }

    document.addEventListener('click', onClick)
    window.addEventListener('scroll', onScroll)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [context])
}
