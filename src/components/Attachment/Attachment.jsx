import React from 'react'
import './Attachment.css'

export default function Attachment({
  attachment,
  isAttached,
  key,
  mode,
  onDelete,
}) {
  return (
    <div className='attachment'>
      <span className='name'>{`${attachment.name}`}</span>
      <span className='controls'>
        <button className='add-comment'>💬</button>
        <button className='delete-comment' onClick={() => onDelete(attachment, isAttached)}>❌</button>
      </span>
    </div>
  )
}