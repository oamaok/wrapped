import { useEffect, useRef } from 'kaiku'

const useIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: Omit<IntersectionObserverInit, 'root'> = {}
) => {
  const ref = useRef<HTMLElement>()

  useEffect(() => {
    if (ref.current) {
      const observer = new IntersectionObserver(callback, {
        ...options,
      })
      observer.observe(ref.current)

      return () => {
        observer.disconnect()
      }
    }
  })

  return ref
}

export default useIntersectionObserver
