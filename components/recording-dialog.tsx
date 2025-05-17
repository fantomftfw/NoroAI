'use client'

import React, { useState, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface RecordingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordingDialog({ open, onOpenChange }: RecordingDialogProps) {
  const [isRecording, setIsRecording] = useState(false)
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/mp3' })
        const audioUrl = URL.createObjectURL(audioBlob)
        localStorage.setItem('recording.mp3', audioUrl)
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
        <div className="flex justify-center space-x-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? 'destructive' : 'default'}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
