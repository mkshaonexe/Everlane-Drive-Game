import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AudioManager } from './AudioManager';

interface AmbientAudioProps {
    speedRef: React.MutableRefObject<number>;
}

export function AmbientAudio({ speedRef }: AmbientAudioProps) {
    const audioManager = useRef(AudioManager.getInstance());
    const gainNode = useRef<GainNode | null>(null);
    const noiseNode = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        const ctx = audioManager.current.context;

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

        return () => {
            noiseNode.current?.stop();
            noiseNode.current?.disconnect();
        };
    }, []);

    useFrame(() => {
        if (gainNode.current) {
            // Wind volume increases with speed
            const speed = speedRef.current;
            const targetVol = Math.min(Math.abs(speed) / 50 * 0.5, 0.5);
            gainNode.current.gain.setTargetAtTime(targetVol, audioManager.current.context.currentTime, 0.1);
        }
    });

    return null;
}
