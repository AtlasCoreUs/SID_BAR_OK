'use client'
import dynamic from 'next/dynamic'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const QuizLauncher = dynamic(() => import('@/components/quiz/QuizLauncher'), { ssr: false })

// Mock data - replace with your actual notes store
const mockNotes = [
  {
    id: 'n1',
    text: 'La loi de Bernoulli établit une relation entre la pression, la vitesse et l\'altitude d\'un fluide. Elle est fondamentale en mécanique des fluides.',
    title: 'Loi de Bernoulli',
    tags: [{ id: 'critical-exam' }],
    updatedAt: Date.now()
  },
  {
    id: 'n2',
    text: 'Une fonction est continue en un point si la limite de la fonction en ce point est égale à la valeur de la fonction en ce point.',
    title: 'Continuité des fonctions',
    tags: [{ id: 'important-exam' }],
    updatedAt: Date.now() - 86400000
  },
  {
    id: 'n3',
    text: 'Un isomorphisme est une application bijective qui préserve la structure algébrique entre deux ensembles.',
    title: 'Isomorphisme',
    tags: [{ id: 'useful-exam' }],
    updatedAt: Date.now() - 2 * 86400000
  },
  {
    id: 'n4',
    text: 'La dérivée d\'une fonction f(x) = x² est f\'(x) = 2x. Cette formule est essentielle pour le calcul différentiel.',
    title: 'Dérivée de x²',
    tags: [{ id: 'critical-exam' }],
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'n5',
    text: 'Le théorème de Pythagore stipule que dans un triangle rectangle, le carré de l\'hypoténuse est égal à la somme des carrés des deux autres côtés.',
    title: 'Théorème de Pythagore',
    tags: [{ id: 'important-exam' }],
    updatedAt: Date.now() - 7200000
  }
]

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-white/10">
          <Link 
            href="/"
            className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">SID — Révision & Tests</h1>
            <p className="text-sm opacity-70">Système de révision espacée intelligent</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <QuizLauncher notes={mockNotes as any} />
        </div>
      </div>
    </div>
  )
}