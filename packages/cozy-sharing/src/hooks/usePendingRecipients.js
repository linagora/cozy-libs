import { useState } from 'react'

export const usePendingRecipients = () => {
  const [pendingRecipients, setPendingRecipients] = useState([])
  const [selectedOption, setSelectedOption] = useState('readWrite')

  return {
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption
  }
}
