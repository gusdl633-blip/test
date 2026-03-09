import React, { useState } from 'react';
import { SajuProfile } from '../services/geminiService';
import NeonCard from './ui/NeonCard';
import GlowButton from './ui/GlowButton';
import GlassInput from './ui/GlassInput';

interface Props {
  onSubmit: (profile: SajuProfile) => void;
}

export default function ProfileForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState<SajuProfile>({
    name: '',
    gender: 'male',
    birthDate: '',
    calendarType: 'solar',
    birthTime: '',
    timeKnown: true,
    location: '',
    mbti: '',
    zodiac_korean: '양자리',
    enneagram: '',
  });

  const mbtiList = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
  ];

  const zodiacList = [
    '양자리', '황소자리', '쌍둥이자리', '게자리',
    '사자자리', '처녀자리', '천칭자리', '전갈자리',
    '사수자리', '염소자리', '물병자리', '물고기자리'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      enneagram: formData.enneagram?.trim() || null
    });
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <NeonCard className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-neon-primary">인간 구조 분석 정보</h2>
          <p className="text-sm text-text-sub">사주와 현대 심리학을 결합하여 당신을 더 뾰족하게 분석합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <GlassInput
            label="이름 (선택)"
            placeholder="닉네임도 좋습니다"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              as="select"
              label="성별"
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: (e.target as HTMLSelectElement).value })}
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </GlassInput>
            <GlassInput
              as="select"
              label="달력"
              value={formData.calendarType}
              onChange={e => setFormData({ ...formData, calendarType: (e.target as HTMLSelectElement).value as 'solar' | 'lunar' })}
            >
              <option value="solar">양력</option>
              <option value="lunar">음력</option>
            </GlassInput>
          </div>

          <GlassInput
            type="date"
            label="생년월일"
            required
            value={formData.birthDate}
            onChange={e => setFormData({ ...formData, birthDate: (e.target as HTMLInputElement).value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-medium text-text-sub">출생 시간</label>
                <label className="flex items-center text-xs text-text-sub/70 cursor-pointer hover:text-neon-primary transition-colors">
                  <input
                    type="checkbox"
                    className="mr-1.5 accent-neon-primary"
                    checked={!formData.timeKnown}
                    onChange={e => setFormData({ ...formData, timeKnown: !e.target.checked })}
                  />
                  모름
                </label>
              </div>
              <input
                type="time"
                disabled={!formData.timeKnown}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text-main disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-neon-primary/30 transition-all"
                value={formData.birthTime}
                onChange={e => setFormData({ ...formData, birthTime: e.target.value })}
              />
            </div>

            <GlassInput
              as="select"
              label="MBTI"
              value={formData.mbti}
              onChange={e => setFormData({ ...formData, mbti: (e.target as HTMLSelectElement).value })}
            >
              <option value="">선택 안함</option>
              {mbtiList.map(m => <option key={m} value={m}>{m}</option>)}
            </GlassInput>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              as="select"
              label="별자리"
              value={formData.zodiac_korean}
              onChange={e => setFormData({ ...formData, zodiac_korean: (e.target as HTMLSelectElement).value })}
            >
              {zodiacList.map(z => <option key={z} value={z}>{z}</option>)}
            </GlassInput>

            <GlassInput
              label="애니어그램 (선택)"
              placeholder="예: 7w8, 5"
              value={formData.enneagram || ''}
              onChange={e => setFormData({ ...formData, enneagram: (e.target as HTMLInputElement).value })}
            />
          </div>

          <GlassInput
            label="출생지 (선택)"
            placeholder="예: 서울, 부산"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: (e.target as HTMLInputElement).value })}
          />

          <GlowButton type="submit" className="w-full mt-4" size="lg">
            운명 확인하기
          </GlowButton>
        </form>
        
        <p className="text-[10px] text-center text-text-sub/40 leading-relaxed">
          입력하신 정보는 사주 풀이 목적으로만 사용되며,<br/>브라우저 로컬 저장소에 안전하게 보관됩니다.
        </p>
      </NeonCard>
    </div>
  );
}
