'use client'

import { useState, useRef, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import GeminiTTS, { GEMINI_VOICES } from './GeminiTTS'

// Language options
const LANGUAGES = [
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', name: 'Duits', flag: '🇩🇪' },
  { code: 'en', name: 'Engels', flag: '🇬🇧' }
]

// CEFR Levels
const CEFR_LEVELS = [
  { 
    code: 'A2', 
    name: 'A2 - Basisgebruiker', 
    description: 'Korte, eenvoudige zinnen over vertrouwde onderwerpen',
    color: 'green'
  },
  { 
    code: 'B1', 
    name: 'B1 - Onafhankelijk', 
    description: 'Duidelijke teksten over school, hobby\'s en werk',
    color: 'blue'
  },
  { 
    code: 'B2', 
    name: 'B2 - Gevorderd', 
    description: 'Complexere teksten met meer details en nuances',
    color: 'purple'
  },
  { 
    code: 'C1', 
    name: 'C1 - Vaardig', 
    description: 'Lange, complexe teksten met impliciete betekenissen',
    color: 'red'
  }
]

// Topics relevant for teenagers
const TOPICS = [
  { 
    id: 'social-gaming', 
    name: 'Social Media & Gaming', 
    icon: '🎮',
    examples: 'TikTok-trends, Fortnite tips, online privacy'
  },
  { 
    id: 'music-movies', 
    name: 'Muziek & Films', 
    icon: '🎵',
    examples: 'Netflix series, K-pop, songtekst-analyse'
  },
  { 
    id: 'school-work', 
    name: 'School & Bijbaan', 
    icon: '📚',
    examples: 'Presentatie tips, solliciteren, stress'
  },
  { 
    id: 'sport-health', 
    name: 'Sport & Gezondheid', 
    icon: '⚽',
    examples: 'Slaap, jonge atleten, nieuwe sporten'
  },
  { 
    id: 'friendship-relations', 
    name: 'Vriendschap & Relaties', 
    icon: '👥',
    examples: 'Ruzies oplossen, plannen maken, groepsdruk'
  },
  { 
    id: 'future-sustainability', 
    name: 'Toekomst & Duurzaamheid', 
    icon: '🌱',
    examples: 'Beroepskeuze, milieu, reizen'
  }
]

interface Question {
  question: string
  options: string[]
  correct: number
  explanation: string
  type: 'factual' | 'main-idea' | 'detail' | 'vocabulary' | 'inference'
}

interface UserProfile {
  totalExercises: number
  scores: { [key: string]: number[] }
  badges: string[]
  vocabulary: string[]
}

type AppState = 'setup' | 'generating' | 'reading' | 'quiz' | 'results'

export default function LevelUpTaal() {
  // State management
  const [appState, setAppState] = useState<AppState>('setup')
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0])
  const [selectedLevel, setSelectedLevel] = useState(CEFR_LEVELS[1]) // Default B1
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0])
  
  // Content state
  const [generatedText, setGeneratedText] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [showText, setShowText] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Audio state
  const [selectedVoice, setSelectedVoice] = useState(GEMINI_VOICES[3]) // Kore
  const [speechRate, setSpeechRate] = useState(1.0)
  
  // User profile (simplified for demo)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    totalExercises: 0,
    scores: {},
    badges: [],
    vocabulary: []
  })

  // Generate content using Gemini AI
  const generateContent = async () => {
    setIsGenerating(true)
    setAppState('generating')
    
    try {
      const prompt = createPrompt()
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate content')
      }
      
      const data = await response.json()
      parseGeneratedContent(data.response)
      
    } catch (error) {
      console.error('Content generation error:', error)
      alert('Er is een fout opgetreden bij het genereren van de inhoud. Probeer het opnieuw.')
      setAppState('setup')
    } finally {
      setIsGenerating(false)
    }
  }

  const createPrompt = () => {
    const languageInstructions = {
      'nl': 'in het Nederlands',
      'de': 'in het Duits', 
      'en': 'in het Engels'
    }
    
    const levelInstructions = {
      'A2': 'A2-niveau (basisgebruiker): Gebruik korte, eenvoudige zinnen. Vertrouwde, alledaagse onderwerpen. Woordenschat van ongeveer 1000-2000 woorden.',
      'B1': 'B1-niveau (onafhankelijke gebruiker): Duidelijke teksten over vertrouwde onderwerpen zoals school, hobby\'s, werk. Woordenschat van ongeveer 2500-3000 woorden.',
      'B2': 'B2-niveau (gevorderde gebruiker): Complexere teksten met meer details en nuances. Abstractere onderwerpen. Woordenschat van ongeveer 4000-5000 woorden.',
      'C1': 'C1-niveau (vaardige gebruiker): Lange, complexe teksten met impliciete betekenissen. Gevarieerde woordenschat van 6000+ woorden.'
    }
    
    const topicExamples = {
      'social-gaming': 'social media trends, gaming, online veiligheid, digitale vriendschappen',
      'music-movies': 'populaire muziek, films en series, entertainment industrie, artiesten',
      'school-work': 'school ervaringen, bijbanen, studie tips, toekomstplannen',
      'sport-health': 'sport en fitness, gezonde levensstijl, mentale gezondheid, voeding',
      'friendship-relations': 'vriendschappen, relaties, sociale situaties, communicatie',
      'future-sustainability': 'toekomstplannen, milieu en duurzaamheid, maatschappelijke kwesties'
    }

    return `Genereer een interessante tekst ${languageInstructions[selectedLanguage.code]} op ${levelInstructions[selectedLevel.code]}

ONDERWERP: ${topicExamples[selectedTopic.id]}

VEREISTEN:
- Tekst van ongeveer 150-250 woorden
- Interessant en relevant voor VMBO-leerlingen (15-18 jaar)
- Geschikt voor ${selectedLevel.code} niveau
- Gebruik moderne, hedendaagse voorbeelden

Na de tekst, genereer 5 meerkeuzevragen met elk 4 antwoordopties:
1. Een feitelijke vraag over de inhoud
2. Een vraag over de hoofdgedachte
3. Een detailvraag over specifieke informatie
4. Een woordenschatvraag over een woord uit de tekst
5. Een inferentievraag (gevolgtrekking)

FORMAT:
=== TEKST ===
[De gegenereerde tekst hier]

=== VRAGEN ===
1. [Vraag 1]
A) [Optie A]
B) [Optie B] 
C) [Optie C]
D) [Optie D]
CORRECT: [A/B/C/D]
UITLEG: [Korte uitleg waarom dit het juiste antwoord is]
TYPE: factual

[Herhaal voor vragen 2-5 met types: main-idea, detail, vocabulary, inference]

Zorg ervoor dat de vragen uitdagend maar eerlijk zijn voor het gekozen niveau.`
  }

  const parseGeneratedContent = (content: string) => {
    try {
      const sections = content.split('=== VRAGEN ===')
      const textSection = sections[0].replace('=== TEKST ===', '').trim()
      const questionsSection = sections[1] || ''
      
      setGeneratedText(textSection)
      
      // Parse questions
      const questionBlocks = questionsSection.split(/\d+\./).filter(block => block.trim())
      const parsedQuestions: Question[] = []
      
      questionBlocks.forEach(block => {
        const lines = block.trim().split('\n').filter(line => line.trim())
        if (lines.length < 7) return // Skip incomplete questions
        
        const question = lines[0].trim()
        const options = lines.slice(1, 5).map(line => line.replace(/^[A-D]\)\s*/, '').trim())
        const correctLine = lines.find(line => line.startsWith('CORRECT:'))
        const explanationLine = lines.find(line => line.startsWith('UITLEG:'))
        const typeLine = lines.find(line => line.startsWith('TYPE:'))
        
        if (correctLine && explanationLine && typeLine) {
          const correctLetter = correctLine.replace('CORRECT:', '').trim()
          const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter)
          
          if (correctIndex !== -1) {
            parsedQuestions.push({
              question,
              options,
              correct: correctIndex,
              explanation: explanationLine.replace('UITLEG:', '').trim(),
              type: typeLine.replace('TYPE:', '').trim() as Question['type']
            })
          }
        }
      })
      
      setQuestions(parsedQuestions)
      setCurrentQuestionIndex(0)
      setUserAnswers([])
      setAppState('reading')
      
    } catch (error) {
      console.error('Error parsing content:', error)
      alert('Er is een fout opgetreden bij het verwerken van de inhoud.')
      setAppState('setup')
    }
  }

  const startQuiz = () => {
    setAppState('quiz')
    setCurrentQuestionIndex(0)
    setUserAnswers([])
  }

  const answerQuestion = (answerIndex: number) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = answerIndex
    setUserAnswers(newAnswers)
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Quiz completed
      setAppState('results')
      updateUserProfile()
    }
  }

  const updateUserProfile = () => {
    const score = userAnswers.reduce((total, answer, index) => {
      return total + (answer === questions[index].correct ? 1 : 0)
    }, 0)
    
    const key = `${selectedLanguage.code}-${selectedLevel.code}`
    const newProfile = { ...userProfile }
    newProfile.totalExercises += 1
    
    if (!newProfile.scores[key]) {
      newProfile.scores[key] = []
    }
    newProfile.scores[key].push(score)
    
    // Add badges
    if (score === 5 && !newProfile.badges.includes('perfect-score')) {
      newProfile.badges.push('perfect-score')
    }
    if (newProfile.totalExercises === 10 && !newProfile.badges.includes('dedicated-learner')) {
      newProfile.badges.push('dedicated-learner')
    }
    
    setUserProfile(newProfile)
  }

  const resetApp = () => {
    setAppState('setup')
    setGeneratedText('')
    setQuestions([])
    setUserAnswers([])
    setCurrentQuestionIndex(0)
    setShowText(true)
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBadgeInfo = (badge: string) => {
    const badges = {
      'perfect-score': { name: 'Perfecte Score!', icon: '🏆', description: 'Alle 5 vragen goed beantwoord' },
      'dedicated-learner': { name: 'Toegewijde Leerling', icon: '📚', description: '10 oefeningen voltooid' }
    }
    return badges[badge as keyof typeof badges]
  }

  // Render different states
  if (appState === 'setup') {
    return (
      <div className="max-w-4xl mx-auto">
        {/* User Profile Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Jouw Voortgang</h2>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userProfile.totalExercises}</div>
                <div className="text-sm text-gray-600">Oefeningen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userProfile.badges.length}</div>
                <div className="text-sm text-gray-600">Badges</div>
              </div>
            </div>
          </div>
          
          {userProfile.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {userProfile.badges.map(badge => {
                const badgeInfo = getBadgeInfo(badge)
                return (
                  <div key={badge} className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    <span className="mr-1">{badgeInfo.icon}</span>
                    {badgeInfo.name}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Start een nieuwe oefening</h2>
          
          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Kies je taal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedLanguage.code === lang.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{lang.flag}</div>
                  <div className="font-medium">{lang.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Level Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Kies je niveau
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CEFR_LEVELS.map(level => (
                <button
                  key={level.code}
                  onClick={() => setSelectedLevel(level)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedLevel.code === level.code
                      ? `border-${level.color}-500 bg-${level.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-bold text-${level.color}-600 mb-1`}>
                    {level.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Kies een onderwerp
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOPICS.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTopic.id === topic.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{topic.icon}</span>
                    <span className="font-medium">{topic.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {topic.examples}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateContent}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Tekst wordt gegenereerd...
              </div>
            ) : (
              '🚀 Start Oefening!'
            )}
          </button>
        </div>
      </div>
    )
  }

  if (appState === 'generating') {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Jouw tekst wordt gegenereerd...
          </h2>
          <p className="text-gray-600 mb-2">
            📝 Onderwerp: {selectedTopic.name}
          </p>
          <p className="text-gray-600 mb-2">
            🎯 Niveau: {selectedLevel.name}
          </p>
          <p className="text-gray-600">
            🌍 Taal: {selectedLanguage.name}
          </p>
        </div>
      </div>
    )
  }

  if (appState === 'reading') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedTopic.icon} {selectedTopic.name}
              </h2>
              <p className="text-gray-600">
                {selectedLanguage.flag} {selectedLanguage.name} • {selectedLevel.name}
              </p>
            </div>
            <button
              onClick={resetApp}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Terug
            </button>
          </div>

          {/* Text Display Controls */}
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowText(!showText)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  showText 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showText ? '👁️ Tekst Verbergen' : '👁️ Tekst Tonen'}
              </button>
              <span className="text-sm text-gray-600">
                {showText ? 'Lees mee terwijl je luistert' : 'Focus op luistervaardigheid'}
              </span>
            </div>
            
            <button
              onClick={startQuiz}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all"
            >
              📝 Start Quiz
            </button>
          </div>

          {/* Text Content */}
          {showText && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <MarkdownRenderer content={generatedText} className="text-lg leading-relaxed" />
            </div>
          )}

          {/* Audio Player */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              🎧 Audio Speler
            </h3>
            <GeminiTTS
              content={generatedText}
              isMarkdown={false}
              selectedVoice={selectedVoice}
              className="mb-4"
            />
            
            {/* Voice Selection */}
            <div className="mt-4 p-4 bg-white rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kies een stem:
              </label>
              <select
                value={selectedVoice.name}
                onChange={(e) => {
                  const voice = GEMINI_VOICES.find(v => v.name === e.target.value)
                  if (voice) setSelectedVoice(voice)
                }}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {GEMINI_VOICES.slice(0, 10).map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (appState === 'quiz') {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Vraag {currentQuestionIndex + 1} van {questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}% voltooid
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mr-3">
                {currentQuestion.type === 'factual' && '📋 Feitelijk'}
                {currentQuestion.type === 'main-idea' && '💡 Hoofdgedachte'}
                {currentQuestion.type === 'detail' && '🔍 Detail'}
                {currentQuestion.type === 'vocabulary' && '📚 Woordenschat'}
                {currentQuestion.type === 'inference' && '🤔 Gevolgtrekking'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => answerQuestion(index)}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium text-gray-700 mr-4">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-800">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setAppState('reading')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Terug naar tekst
            </button>
            <div className="text-sm text-gray-500">
              Klik op een antwoord om door te gaan
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (appState === 'results') {
    const score = userAnswers.reduce((total, answer, index) => {
      return total + (answer === questions[index].correct ? 1 : 0)
    }, 0)
    
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Score Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {score === 5 ? '🏆' : score >= 4 ? '🎉' : score >= 3 ? '👍' : '💪'}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Quiz Voltooid!
            </h2>
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(score)}`}>
              {score}/{questions.length} ({percentage}%)
            </div>
            <p className="text-gray-600">
              {score === 5 && "Perfect! Uitstekend begrip van de tekst! 🌟"}
              {score === 4 && "Heel goed! Je hebt de tekst goed begrepen! 👏"}
              {score === 3 && "Goed gedaan! Er is nog ruimte voor verbetering. 📈"}
              {score <= 2 && "Blijf oefenen! Elke poging maakt je beter! 💪"}
            </p>
          </div>

          {/* Detailed Results */}
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800">Gedetailleerde Resultaten</h3>
            
            {questions.map((question, index) => {
              const userAnswer = userAnswers[index]
              const isCorrect = userAnswer === question.correct
              
              return (
                <div key={index} className={`p-6 rounded-lg border-2 ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 flex-1">
                      {index + 1}. {question.question}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? '✓ Correct' : '✗ Fout'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Jouw antwoord:</p>
                      <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {String.fromCharCode(65 + userAnswer)} {question.options[userAnswer]}
                      </p>
                    </div>
                    {!isCorrect && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Correct antwoord:</p>
                        <p className="font-medium text-green-700">
                          {String.fromCharCode(65 + question.correct)} {question.options[question.correct]}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {!isCorrect && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Uitleg:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setAppState('reading')}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
            >
              📖 Lees Tekst Opnieuw
            </button>
            <button
              onClick={resetApp}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all"
            >
              🚀 Nieuwe Oefening
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}