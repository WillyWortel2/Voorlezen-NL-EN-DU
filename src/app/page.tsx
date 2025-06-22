import LevelUpTaal from '@/components/LevelUpTaal'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            LevelUp Taal
          </h1>
          
          <p className="text-xl text-gray-700 font-medium mb-2">
            Interactieve Taalhulp voor VMBO-leerlingen
          </p>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verbeter je Nederlands, Duits en Engels op jouw niveau en tempo! 
            Luister naar interessante teksten en test je begrip met interactieve vragen.
          </p>
        </div>

        {/* Main App */}
        <LevelUpTaal />

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <div className="inline-flex items-center space-x-4 text-gray-600">
            <span>🚀</span>
            <span>Powered by Gemini AI & Advanced TTS</span>
            <span>🚀</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            LevelUp Taal • Gemaakt voor VMBO-leerlingen • Ondersteunt A2-C1 niveaus
          </p>
        </div>
      </div>
    </div>
  )
}