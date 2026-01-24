import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AudioManager } from './AudioManager';
import { useGameStore } from '../stores/gameStore';

interface AmbientAudioProps {
    speedRef: React.MutableRefObject<number>;
}

export function AmbientAudio({ speedRef }: AmbientAudioProps) {
    const audioManager = useRef(AudioManager.getInstance());
    const gainNode = useRef<GainNode | null>(null);
    const noiseNode = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        const ctx = audioManager.current.context;

        const startAudio = () => {
            // Create white noise buffer
            const bufferSize = ctx.sampleRate * 2; // 2 seconds
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            noiseNode.current = ctx.createBufferSource();
            noiseNode.current.buffer = buffer;
            noiseNode.current.loop = true;

            // Filter to make it sound like wind (LowPass)
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            gainNode.current = ctx.createGain();
            gainNode.current.gain.value = 0;

            noiseNode.current.connect(filter);
            filter.connect(gainNode.current);
            gainNode.current.connect(audioManager.current.masterGain);

            noiseNode.current.start();
        };

        // Only start if context is running
        if (ctx.state === 'running') {
            startAudio();
        } else {
            // Retry on user interaction
            const retryStart = () => {
                if (ctx.state === 'running') {
                    startAudio();
                    document.removeEventListener('click', retryStart);
                    document.removeEventListener('keydown', retryStart);
                }
            };
            document.addEventListener('click', retryStart);
            document.addEventListener('keydown', retryStart);
        }

        return () => {
            noiseNode.current?.stop();
            noiseNode.current?.disconnect();
        };
    }, []);

    useFrame(() => {
        if (gainNode.current) {
            const isMuted = useGameStore.getState().isMuted;
            const now = audioManager.current.context.currentTime;

            if (isMuted) {
                gainNode.current.gain.setTargetAtTime(0, now, 0.1);
                return;
            }

            // Wind volume increases with speed
            const speed = speedRef.current;
            const targetVol = Math.min(Math.abs(speed) / 50 * 0.5, 0.5);
            gainNode.current.gain.setTargetAtTime(targetVol, now, 0.1);
        }
    });

    return null;
}
