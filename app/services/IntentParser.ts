/**
 * IntentParser: Maps hand landmarks/gestures to blockchain intents.
 */

export interface SignIntent {
    intent: "TRANSFER_MON" | "TRANSFER_SOL" | "GET_BALANCE" | "CONFIRM" | "CANCEL" | "UNKNOWN";
    amount?: number;
    confidence: number;
}

export class IntentParser {
    /**
     * Simple point-based gesture logic.
     * In production, this would use a more robust LSTM or temporal model.
     */
    parseLandmarks(results: any): SignIntent {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            return { intent: "UNKNOWN", confidence: 0 };
        }

        const landmarks = results.multiHandLandmarks[0]; // Primary hand

        // 1. Detect OPEN PALM (all fingers up)
        if (this.isOpenPalm(landmarks)) {
            return { intent: "TRANSFER_MON", amount: 0.01, confidence: 0.9 };
        }

        // 2. Detect FIST (all fingers down)
        if (this.isFist(landmarks)) {
            return { intent: "CONFIRM", confidence: 0.95 };
        }

        // 3. Detect ONE FINGER (Index up, others down)
        if (this.isOneFinger(landmarks)) {
            return { intent: "GET_BALANCE", confidence: 0.85 };
        }

        // 4. Detect THUMBS DOWN (Thumb down, others curled)
        if (this.isThumbsDown(landmarks)) {
            return { intent: "CANCEL", confidence: 0.9 };
        }

        return { intent: "UNKNOWN", confidence: 0.5 };
    }

    private isOpenPalm(landmarks: any[]): boolean {
        const tipIds = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
        const baseIds = [6, 10, 14, 18]; // Joints

        const extendedFingers = tipIds.filter((id, i) => landmarks[id].y < landmarks[baseIds[i]].y);
        return extendedFingers.length >= 3; // Simplified
    }

    private isFist(landmarks: any[]): boolean {
        const tipIds = [8, 12, 16, 20];
        const baseIds = [6, 10, 14, 18];

        const extendedFingers = tipIds.filter((id, i) => landmarks[id].y < landmarks[baseIds[i]].y);
        return extendedFingers.length === 0;
    }

    private isOneFinger(landmarks: any[]): boolean {
        const indexTip = landmarks[8];
        const indexBase = landmarks[6];
        const middleTip = landmarks[12];
        const middleBase = landmarks[10];

        const indexExtended = indexTip.y < indexBase.y;
        const middleExtended = middleTip.y < middleBase.y;

        return indexExtended && !middleExtended;
    }

    private isThumbsUp(landmarks: any[]): boolean {
        const thumbTip = landmarks[4];
        const thumbBase = landmarks[2];
        const indexTip = landmarks[8];
        const indexBase = landmarks[6];

        return thumbTip.y < thumbBase.y && indexTip.y > indexBase.y;
    }

    private isThumbsDown(landmarks: any[]): boolean {
        const thumbTip = landmarks[4];
        const thumbBase = landmarks[2];
        const indexTip = landmarks[8];
        const indexBase = landmarks[6];

        return thumbTip.y > thumbBase.y && indexTip.y < indexBase.y;
    }
}

export const intentParser = new IntentParser();
