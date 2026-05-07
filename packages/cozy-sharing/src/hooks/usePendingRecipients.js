import { useCallback, useState } from 'react'

export const usePendingRecipients = () => {
  const [pendingRecipients, setPendingRecipients] = useState([])
  const [selectedOption, setSelectedOption] = useState('readWrite')

  const reset = useCallback(() => {
    setPendingRecipients([])
    setSelectedOption('readWrite')
  }, [])

  return {
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption,
    reset
  }
}
