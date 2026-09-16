import type { CareerRole } from "./careers-data";

// Preview content, loaded only by the local-development fallback in getCareerRoles.
export const LOCAL_CAREER_SAMPLE: CareerRole = {
  id: "local-preview-hardware-engineer",
  title: { zh: "硬件研发工程师（本地示例）", en: "Hardware Engineer (local sample)" },
  team: { zh: "硬件研发", en: "Hardware engineering" },
  location: { zh: "深圳 · 全职", en: "Shenzhen · Full-time" },
  type: { zh: "示例职位 · 非真实招聘", en: "Preview only · Not a real opening" },
  summary: {
    zh: "参与模块化电子产品从原型到量产的开发，与软件、结构和产品团队共同完成可靠的造物体验。本条仅供本地查看招聘页面效果。",
    en: "Develop modular electronics from prototype to production with software, mechanical, and product teams. This sample is for local layout review only."
  },
  responsibilities: [
    { zh: "负责电子模块的原理图、PCB 设计与调试。", en: "Design and debug electronic block schematics and PCBs." },
    { zh: "参与样机验证，分析并解决可靠性和系统协同问题。", en: "Validate prototypes and investigate reliability and system integration issues." },
    { zh: "与跨专业团队协作，推动设计从验证走向量产。", en: "Collaborate across disciplines to take designs from validation to production." }
  ],
  requirements: [
    { zh: "具备电子、电气或相关工程基础。", en: "A foundation in electronics, electrical engineering, or a related field." },
    { zh: "熟悉常用接口、电子元器件及硬件调试工具。", en: "Familiarity with common interfaces, components, and hardware debugging tools." },
    { zh: "能够清晰记录问题，通过实验验证判断。", en: "Communicate findings clearly and validate decisions through experiments." }
  ],
  niceToHave: [
    { zh: "有机器人、智能硬件或开源项目经验。", en: "Experience with robotics, smart hardware, or open-source projects." },
    { zh: "喜欢动手制作，有自己的作品或项目。", en: "Enjoy building things and have personal projects to share." }
  ],
  benefits: [
    { zh: "跨专业团队协作，参与完整产品开发。", en: "Work across disciplines throughout the product development cycle." },
    { zh: "工作方式与具体待遇以真实岗位说明为准。", en: "Working arrangements and benefits are subject to the actual job listing." }
  ],
  tags: [
    { zh: "硬件研发", en: "Hardware engineering" },
    { zh: "电路 / PCB", en: "Circuit / PCB design" },
    { zh: "本地预览", en: "Local preview" }
  ],
  postedAt: "2026-09-16",
  status: "open"
};
