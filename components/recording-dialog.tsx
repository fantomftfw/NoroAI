'use client'

import React, { useState, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import axios from 'axios'

interface RecordingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordingDialog({ open, onOpenChange }: RecordingDialogProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/mp3' })

        // Store in localStorage and create URL for playback
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64Audio = reader.result as string
          localStorage.setItem('lastRecording', base64Audio)
          const url = URL.createObjectURL(audioBlob)
          setAudioUrl(url)
          console.log('Audio stored in localStorage and URL created for playback')
        }

        try {
          const audioFile = new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' })
          const formData = new FormData()
          formData.append('audio', audioFile)
          formData.append('currentDateTime', new Date().toISOString())

          const response = await axios.post('/api/process-task', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          console.log('Success:', response.data)
          console.log('Task processed successfully')
        } catch (error) {
          console.error('Error processing task:', error)
        }

        setIsRecording(false)
        // Clean up the stream
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Voice Recording</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'default'}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </div>
          {audioUrl && (
            <div className="mt-4">
              <audio src={audioUrl} controls className="w-full" />
              <p className="mt-2 text-sm text-gray-500">
                Recording saved in localStorage for debugging
              </p>
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
