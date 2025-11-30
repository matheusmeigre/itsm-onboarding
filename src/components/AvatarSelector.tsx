import { useState } from 'react';
import { Check } from 'lucide-react';

const AVATARS = [
  { id: 1, color: 'bg-cyan-500', name: 'Azul Claro' },
  { id: 2, color: 'bg-pink-500', name: 'Rosa' },
  { id: 3, color: 'bg-blue-600', name: 'Azul Escuro' },
  { id: 4, color: 'bg-amber-500', name: 'Amarelo' },
  { id: 5, color: 'bg-orange-500', name: 'Laranja' },
  { id: 6, color: 'bg-teal-500', name: 'Verde Água' },
  { id: 7, color: 'bg-purple-600', name: 'Roxo' },
  { id: 8, color: 'bg-green-500', name: 'Verde' },
  { id: 9, color: 'bg-red-500', name: 'Vermelho' },
  { id: 10, color: 'bg-indigo-600', name: 'Índigo' },
  { id: 11, color: 'bg-lime-500', name: 'Lima' },
  { id: 12, color: 'bg-rose-500', name: 'Rosa Escuro' },
  { id: 13, color: 'bg-sky-500', name: 'Azul Céu' },
  { id: 14, color: 'bg-violet-500', name: 'Violeta' },
  { id: 15, color: 'bg-emerald-500', name: 'Esmeralda' },
  { id: 16, color: 'bg-fuchsia-500', name: 'Fúcsia' },
];

interface AvatarSelectorProps {
  selected: string;
  onSelect: (color: string) => void;
}

export function AvatarSelector({ selected, onSelect }: AvatarSelectorProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // Renderiza o avatar como círculo colorido com silhueta
  const renderAvatar = (color: string, size: 'sm' | 'lg' = 'sm') => {
    const sizeClasses = size === 'lg' ? 'w-24 h-24' : 'w-12 h-12';
    return (
      <div className={`${sizeClasses} ${color} rounded-full flex items-center justify-center relative overflow-hidden shadow-lg`}>
        {/* Silhueta de pessoa */}
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="relative" style={{ width: '70%', height: '70%' }}>
            {/* Cabeça */}
            <div className="absolute top-[15%] left-1/2 transform -translate-x-1/2 w-[35%] h-[35%] bg-white/90 rounded-full"></div>
            {/* Corpo */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[70%] h-[55%] bg-white/90 rounded-t-full"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-3 animate-scaleIn">
          {renderAvatar(selected || 'bg-gray-400', 'lg')}
        </div>
        <p className="text-sm text-gray-600">Avatar selecionado</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {AVATARS.map((avatar, index) => {
          const isSelected = selected === avatar.color;
          const isHovered = hoveredId === avatar.id;

          return (
            <button
              key={avatar.id}
              onClick={() => onSelect(avatar.color)}
              onMouseEnter={() => setHoveredId(avatar.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative group p-2 rounded-xl smooth-transition flex items-center justify-center
                ${isSelected
                  ? 'bg-blue-100 ring-2 ring-blue-500 shadow-md scale-105'
                  : 'bg-gray-50 hover:bg-gray-100 hover:scale-110 hover:shadow-lg'
                }
              `}
              style={{ animationDelay: `${index * 30}ms` }}
              title={avatar.name}
            >
              {renderAvatar(avatar.color, 'sm')}
              
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center animate-scaleIn">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {isHovered && !isSelected && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap animate-slideInBottom z-10">
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
