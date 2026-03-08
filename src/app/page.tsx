'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export default function Home() {
  const router = useRouter()
  return <LandingPage />
}
