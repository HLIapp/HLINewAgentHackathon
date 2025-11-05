/**
 * Shared Intervention Header Component
 * Displays intervention metadata consistently across all intervention views
 * This will translate directly to SwiftUI View component
 */

import { StaticIntervention } from '@/data/staticInterventions';

interface InterventionHeaderProps {
  intervention: StaticIntervention;
  onBack?: () => void;
}

export function getPhaseColor(phase: string): string {
  const colors = {
    menstrual: 'bg-red-50 text-red-700 border-red-200',
    follicular: 'bg-green-50 text-green-700 border-green-200',
    ovulatory: 'bg-blue-50 text-blue-700 border-blue-200',
    luteal: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return colors[phase as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
}

export function getPhaseGuidance(phase: string, category: string) {
  const guidance: Record<string, Record<string, { title: string; description: string; tips: string[] }>> = {
    menstrual: {
      movement: {
        title: 'Why This Matters',
        description: 'During your menstrual phase, your body needs gentle movement and rest. This practice supports your body\'s natural recovery process.',
        tips: [
          'Listen to your body—if something doesn\'t feel right, modify or skip',
          'This is a time for self-compassion, not pushing yourself',
          'Even gentle movement can help ease discomfort'
        ]
      },
      breathwork: {
        title: 'Why This Matters',
        description: 'Your menstrual phase is a time when your body naturally wants to slow down. Breathwork can help you honor that need while easing any discomfort.',
        tips: [
          'There\'s no "right" way to breathe—just what feels good to you',
          'If you feel dizzy, slow down or stop',
          'This practice is here to support you, not add pressure'
        ]
      },
      supplementation: {
        title: 'Why This Matters',
        description: 'During your period, your body is working hard. Simple comfort measures can make a significant difference in how you feel.',
        tips: [
          'This is evidence-based care for your body',
          'You deserve comfort and relief',
          'Take your time—there\'s no rush'
        ]
      }
    },
    follicular: {
      movement: {
        title: 'Why This Matters',
        description: 'During your follicular phase, rising estrogen gives you more energy and strength. This is the perfect time to build momentum.',
        tips: [
          'Your body is primed for building strength right now',
          'Start where you are—every movement counts',
          'This phase supports your body\'s natural capacity for growth'
        ]
      },
      nutrition: {
        title: 'Why This Matters',
        description: 'Your follicular phase is when your body is building. Nourishing yourself well now supports your entire cycle.',
        tips: [
          'Food is fuel and medicine for your body',
          'Every meal is an opportunity to support your wellbeing',
          'Simple, consistent choices make a big difference'
        ]
      },
      mindset: {
        title: 'Why This Matters',
        description: 'During your follicular phase, your cognitive function and optimism peak. This is the perfect time to harness that clarity.',
        tips: [
          'Your brain is at its most capable right now',
          'This is a great time to set intentions',
          'Trust your instincts—they\'re sharper during this phase'
        ]
      }
    },
    ovulatory: {
      movement: {
        title: 'Why This Matters',
        description: 'During ovulation, your body reaches peak performance. This is your window to challenge yourself and feel your strength.',
        tips: [
          'Your coordination and reaction time are at their peak',
          'This is a great time to try something new',
          'Your body is showing you what it\'s capable of'
        ]
      },
      mindset: {
        title: 'Why This Matters',
        description: 'During ovulation, your communication skills and confidence peak. Use this energy to express yourself authentically.',
        tips: [
          'Your words carry more weight when you\'re clear',
          'This is a powerful time for setting boundaries',
          'Trust your voice—it\'s strongest right now'
        ]
      },
      reflection: {
        title: 'Why This Matters',
        description: 'During ovulation, your mood and self-perception are at their peak. This is the perfect time to acknowledge your wins.',
        tips: [
          'Celebrating yourself builds confidence',
          'Your accomplishments deserve recognition',
          'Positive self-reflection supports your wellbeing'
        ]
      }
    },
    luteal: {
      movement: {
        title: 'Why This Matters',
        description: 'During your luteal phase, your body needs gentle, grounding movement. This practice supports your body\'s natural rhythm.',
        tips: [
          'Gentle movement can ease tension and discomfort',
          'This is not about pushing—it\'s about supporting',
          'Your body knows what it needs—listen to it'
        ]
      },
      reflection: {
        title: 'Why This Matters',
        description: 'During your luteal phase, emotions can feel more intense. Journaling helps process these feelings without judgment.',
        tips: [
          'There\'s no right or wrong way to journal',
          'Writing helps you understand yourself better',
          'This is a safe space for whatever you\'re feeling'
        ]
      },
      breathwork: {
        title: 'Why This Matters',
        description: 'During your luteal phase, your nervous system may be more sensitive to stress. Breathwork helps you find calm.',
        tips: [
          'This practice directly supports your nervous system',
          'Even a few minutes can make a difference',
          'You\'re learning to regulate your body\'s response'
        ]
      }
    }
  };
  
  return guidance[phase]?.[category] || {
    title: 'Why This Matters',
    description: 'This practice is designed to support your body during this phase of your cycle.',
    tips: [
      'Listen to your body',
      'There\'s no perfect way to do this',
      'Every small step counts'
    ]
  };
}

export default function InterventionHeader({ intervention, onBack }: InterventionHeaderProps) {
  return (
    <>
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
      )}
      <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-4xl">{intervention.emoji}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {intervention.phase_tags.map((phase) => (
                <span
                  key={phase}
                  className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${getPhaseColor(phase)}`}
                >
                  {phase}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
              {intervention.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{intervention.duration_minutes} min</span>
              <span>·</span>
              <span className="capitalize">{intervention.category}</span>
              <span>·</span>
              <span>{intervention.location}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-900 leading-relaxed mb-4 font-medium">
          {intervention.description}
        </p>
        {intervention.phase_tags[0] && (
          <div className={`rounded-lg border p-4 mb-4 ${getPhaseColor(intervention.phase_tags[0])}`}>
            {(() => {
              const guidance = getPhaseGuidance(intervention.phase_tags[0], intervention.category);
              return (
                <>
                  <h3 className="text-xs font-semibold mb-2">{guidance.title}</h3>
                  <p className="text-xs leading-relaxed mb-3">{guidance.description}</p>
                  <div className="space-y-1">
                    {guidance.tips.map((tip: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5">•</span>
                        <p className="text-xs leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
        <p className="text-xs text-gray-500">
          <a 
            href="#research" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            {intervention.research}
          </a>
        </p>
      </div>
    </>
  );
}

