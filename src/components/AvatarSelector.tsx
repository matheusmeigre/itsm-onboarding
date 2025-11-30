import { useState } from 'react';
import { Check } from 'lucide-react';

const AVATARS = [
  { id: 1, emoji: '👨‍💼', name: 'Profissional' },
  { id: 2, emoji: '👩‍💼', name: 'Profissional Feminino' },
  { id: 3, emoji: '🧑‍💻', name: 'Desenvolvedor' },
  { id: 4, emoji: '👨‍🔧', name: 'Técnico' },
  { id: 5, emoji: '👩‍🔬', name: 'Cientista' },
  { id: 6, emoji: '👨‍🎓', name: 'Estudante' },
  { id: 7, emoji: '👩‍🏫', name: 'Professora' },
  { id: 8, emoji: '👨‍⚕️', name: 'Médico' },
  { id: 9, emoji: '👩‍🎨', name: 'Designer' },
  { id: 10, emoji: '👨‍🚀', name: 'Astronauta' },
  { id: 11, emoji: '👩‍🌾', name: 'Agricultora' },
  { id: 12, emoji: '👨‍🍳', name: 'Chef' },
  { id: 13, emoji: '🦸‍♂️', name: 'Super-Herói' },
  { id: 14, emoji: '🦸‍♀️', name: 'Super-Heroína' },
  { id: 15, emoji: '🧙‍♂️', name: 'Mago' },
  { id: 16, emoji: '🧙‍♀️', name: 'Maga' },
  { id: 17, emoji: '🧑‍🎤', name: 'Artista' },
  { id: 18, emoji: '👨‍✈️', name: 'Piloto' },
  { id: 19, emoji: '👩‍🚒', name: 'Bombeira' },
  { id: 20, emoji: '👨‍⚖️', name: 'Juiz' },
];

interface AvatarSelectorProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

export function AvatarSelector({ selected, onSelect }: AvatarSelectorProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-3 animate-scaleIn">
          <span className="text-5xl">{selected || '👤'}</span>
        </div>
        <p className="text-sm text-gray-600">Avatar selecionado</p>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {AVATARS.map((avatar, index) => {
          const isSelected = selected === avatar.emoji;
          const isHovered = hoveredId === avatar.id;

          return (
            <button
              key={avatar.id}
              onClick={() => onSelect(avatar.emoji)}
              onMouseEnter={() => setHoveredId(avatar.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative group p-3 rounded-xl smooth-transition
                ${isSelected
                  ? 'bg-blue-100 ring-2 ring-blue-500 shadow-md scale-105'
                  : 'bg-gray-50 hover:bg-gray-100 hover:scale-110 hover:shadow-lg'
                }
              `}
              style={{ animationDelay: `${index * 30}ms` }}
              title={avatar.name}
            >
              <span className="text-3xl block">{avatar.emoji}</span>
              
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-scaleIn">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {isHovered && !isSelected && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap animate-slideInBottom">
                  {avatar.name}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
