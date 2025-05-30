import React, { useEffect, useState } from 'react'
import { Attachment } from '../Attachment'
import './FileInput.css'

export default function FileInput({
  mode,
  onChange,
  attachedFiles,
  onError,
  acceptedFileTypes,
  getUploadUrl,
  uploadFile,
  style
}) {
  const [active, setActive] = useState(false)
  const [unattachedFiles, setUnattachedFiles] = useState([])

  const handleFileUpload = async (file) => {
    if (!file) return null

    const uploadUrlResponse = await getUploadUrl?.(file)?.catch(err => onError({ type: 'get-upload-url-error', error: err }))
    const uploadUrlResData = await uploadUrlResponse?.json?.()
    const uploadResponse = await uploadFile(file, uploadUrlResData?.data)?.catch(error => onError({ type: 'upload-file-error', error }))

    onChange({ type: 'file-upload', data: uploadResponse })

    return file
  }

  useEffect(
    () => {
      const activate = () => setActive(true)
      const deactivate = () => setActive(false)

      document.addEventListener('dragover', activate)
      document.addEventListener('dragend', deactivate)

      return () => {
        document.removeEventListener('dragover', activate)
        document.removeEventListener('dragend', deactivate)
      }
    },
    [mode]
  )

  useEffect(
    () => {
      const attachedIds = attachedFiles.map(file => file.id)
      const filtered = unattachedFiles.filter(({ id }) => !attachedIds.includes(id))

      if (filtered.length !== unattachedFiles.length) setUnattachedFiles(filtered)
    },
    [attachedFiles]
  )

  useEffect(
    () => {
      onChange({ unattachedFiles })
    },
    [unattachedFiles]
  )

  const validateFile = (file) => {
    if (!(file?.type || file?.name)) return

    const type = file.type?.split('/')
    const extension = file.name?.split('.').at(-1)

    const acceptableExtension = acceptedFileTypes.extensions?.includes(extension) || acceptedFileTypes.extensions?.includes('*')

    return acceptedFileTypes.mime_types?.includes(type?.at(-1)) || acceptableExtension
  }

  const updateFiles = (newFiles) => (Promise.all(newFiles
    .filter(validateFile)
    .map(handleFileUpload))
      .then(newAttachments => setUnattachedFiles([...unattachedFiles, ...newAttachments])))
      .catch(err => onError({ type: 'file-upload-error', error: err }))

  const handleDrop = (evt) => {
    setActive(false)
    evt.preventDefault()
    evt.stopPropagation()

    const dataArray = Array.from(evt.dataTransfer?.items || evt.target?.files || evt.dataTransfer?.files)

    if (evt.dataTransfer?.items) return updateFiles(dataArray.map(f => f?.getAsFile?.()).filter(f => f))

    return updateFiles(dataArray.filter(f => f))
  }

  const handleDragOver = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
  }

  const handleDelete = (attachment, isAttached) => {
    setUnattachedFiles(unattachedFiles.filter(({ name }) => name !== attachment.name))
    console.info(`${attachment.name} has been successfully deleted.`)
  }

  const renderFile = (attachment, isAttached) => (
    <Attachment
      attachment={attachment}
      isAttached={isAttached}
      key={attachment.id}
      mode={mode}
      onDelete={handleDelete}
    />
  )

  const renderFiles = () => {
    const attachmentIds = attachedFiles.map(file => file.id)
    const unattached = unattachedFiles?.filter(({ id }) => !attachmentIds.includes(id)).map(file => renderFile(file, false))
    const attached = attachedFiles?.map(file => renderFile(file, true))

    return [...attached, ...unattached]
  }

  return (
    <div>
      <div hidden={!active} className='dropzone' onDrop={handleDrop} onDragOver={handleDragOver} />
      <div className='button-group-header' padding='40px 0 10px 0'>Attachments</div>
      {
        mode !== 'read'
        && (
          <label style={{width: '100%'}} onChange={handleDrop} htmlFor='inputId'>
            <input
              id='inputId'
              className={'file-input'}
              type='file'
              accept={acceptedFileTypes.extensions}
              multiple
              hidden
              onClick={evt => evt.target.value = null} // this resolves a chrome issue where you can't add a file, remove that file, and add the same file again.
            />
            <div className='file-input-area'>
              <span className='upload-icon' style={{
                padingRight: '10px',
                fontSize: 'medium',
              }}>⬆☁</span>
              <p>
                Drop Files to attach or
                { ' ' }
                <a className='browse-link'>browse</a>
              </p>
            </div>
          </label>
        )
      }
      <div className='attachments'>
        {renderFiles()}
      </div>
    </div>
  )
}

FileInput.defaultProps = {
  acceptedFileTypes: {
    // mime_types: ['pdf','csv'],
    extensions: '*',
  },
  mode: 'create',
  onChange: () => console.info('onChange not implemented'),
  attachedFiles: [],
  onError: (type, error) => console.error({ type, error }),
  getUploadUrl: null,
  uploadFile: async () => console.info('uploadFile not implemented'),
  style: null
}
