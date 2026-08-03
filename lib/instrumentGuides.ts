export type GuideType = "recorder" | "handbell" | "melodica" | "xylophone" | "general";

export type InstrumentGuide = {
  label: string;
  orientation: "portrait" | "landscape";
  framing: string;
  tips: string[];
};

export const INSTRUMENT_GUIDES: Record<GuideType, InstrumentGuide> = {
  recorder: {
    label: "리코더",
    orientation: "portrait",
    framing: "상반신 전체 + 손가락이 보이도록 세로로 촬영해요.",
    tips: [
      "리코더를 몸과 45도 각도로 세워서 잡아요.",
      "양손 손가락이 모두 화면에 보이도록 해요.",
      "허리를 펴고 어깨는 수평을 유지해요.",
    ],
  },
  handbell: {
    label: "핸드벨",
    orientation: "landscape",
    framing: "상반신과 양손 전체가 보이도록 가로로 촬영해요.",
    tips: [
      "벨을 든 손이 화면 중앙에 오도록 서요.",
      "팔을 흔드는 동작이 잘리지 않게 여유 공간을 둬요.",
      "어깨 높이와 눈높이를 카메라와 맞춰요.",
    ],
  },
  melodica: {
    label: "멜로디언",
    orientation: "landscape",
    framing: "건반과 상반신이 함께 보이도록 가로로 촬영해요.",
    tips: [
      "건반 전체가 화면 아래쪽에 들어오게 해요.",
      "호스를 문 입 모양이 보이도록 정면을 바라봐요.",
      "책상 위 악보와 카메라 각도를 미리 확인해요.",
    ],
  },
  xylophone: {
    label: "실로폰",
    orientation: "landscape",
    framing: "악기 전체와 채를 쥔 양손이 보이도록 가로로 촬영해요.",
    tips: [
      "실로폰 음판 전체가 화면에 들어오게 해요.",
      "채를 쥔 손 모양이 잘 보이도록 카메라를 낮춰요.",
      "의자에 앉았다면 등받이에서 살짝 떨어져 앉아요.",
    ],
  },
  general: {
    label: "기타 악기",
    orientation: "portrait",
    framing: "상반신 전체가 보이도록 촬영해요.",
    tips: [
      "악기와 몸 전체가 화면 안에 들어오는지 확인해요.",
      "밝은 곳에서 촬영하면 자세가 더 잘 보여요.",
      "주변 소음이 적은 곳에서 녹화해요.",
    ],
  },
};

export function getInstrumentGuide(guideType: string): InstrumentGuide {
  return INSTRUMENT_GUIDES[guideType as GuideType] ?? INSTRUMENT_GUIDES.general;
}
