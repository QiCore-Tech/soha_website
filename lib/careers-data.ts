export type CareerText = {
  zh: string;
  en: string;
};

export type CareerRole = {
  id: string;
  title: CareerText;
  team: CareerText;
  location: CareerText;
  type: CareerText;
  summary: CareerText;
  responsibilities: CareerText[];
  requirements: CareerText[];
  niceToHave: CareerText[];
  benefits: CareerText[];
  tags: CareerText[];
  postedAt: string;
  status: "open" | "soon";
};

/**
 * Temporary editorial content for the first Careers release.
 * Keep this shape stable so it can later be replaced by a CMS adapter
 * (for example, a published Feishu Bitable view) without changing the UI.
 */
export const CAREER_ROLES: CareerRole[] = [
  {
    id: "mechanical-design-engineer",
    title: { zh: "结构工程师", en: "Mechanical Design Engineer" },
    team: { zh: "结构与制造", en: "Mechanical Design & Manufacturing" },
    location: { zh: "深圳 · 全职 · 提供实习岗位", en: "Shenzhen · Full-time · Internships available" },
    type: { zh: "薪资面议", en: "Compensation discussed during the process" },
    summary: {
      zh: "从概念到量产，把一个好想法做成可靠的产品。",
      en: "Take a good idea from concept to a reliable, manufacturable product."
    },
    responsibilities: [
      { zh: "负责产品结构设计与开发，参与从概念评估到量产落地的全过程。", en: "Own product structure design from concept evaluation through mass production." },
      { zh: "绘制并输出 2D / 3D 工程图纸，编制产品 BOM。", en: "Create 2D / 3D engineering drawings and maintain the product BOM." },
      { zh: "对接生产与供应链，编制 SOP、检验标准等技术资料。", en: "Work with production and supply chain on SOPs, inspection standards, and technical documentation." },
      { zh: "参与手板、开模、试产和量产，及时解决结构、工艺与装配问题。", en: "Support prototypes, tooling, pilot runs, and production; resolve structural, process, and assembly issues." },
      { zh: "持续推进结构优化、工艺改良和降本增效。", en: "Improve structure and process throughout the product lifecycle." }
    ],
    requirements: [
      { zh: "本科及以上学历，机械设计制造、机电工程等相关专业。", en: "Bachelor's degree or above in mechanical design, mechatronics, or a related field." },
      { zh: "2–5 年结构设计经验，有消费电子或家电产品量产案例。", en: "2–5 years of structural design experience, ideally with consumer product launches." },
      { zh: "熟练使用 Creo / Pro-E、SolidWorks、AutoCAD 等 2D / 3D 工具。", en: "Proficient with Creo / Pro-E, SolidWorks, AutoCAD, or similar 2D / 3D tools." },
      { zh: "熟悉塑胶、五金、硅胶材料，以及注塑、冲压、压铸和表面处理工艺。", en: "Familiar with plastics, metals, silicone, injection molding, stamping, die casting, and finishing." },
      { zh: "了解电子产品安规与环保要求，如 CE、FCC、RoHS、3C。", en: "Familiar with product compliance and environmental requirements such as CE, FCC, RoHS, and 3C." }
    ],
    niceToHave: [
      { zh: "对产品生命周期管理有系统认识，能推动跨部门协作。", en: "A systems view of product lifecycle management and cross-functional collaboration." },
      { zh: "善于拆解复杂问题，愿意和设计、电子、品质及供应链团队一起工作。", en: "A knack for breaking down complex problems and working across design, electronics, quality, and supply chain." }
    ],
    tags: [
      { zh: "机械 / 结构", en: "Mechanical design" },
      { zh: "产品结构", en: "Product engineering" },
      { zh: "量产 / DFM", en: "Manufacturing / DFM" },
      { zh: "智能硬件", en: "Smart hardware" }
    ],
    benefits: [
      { zh: "薪资面议", en: "Compensation discussed during the process" },
      { zh: "入职即缴纳五险一金", en: "Statutory benefits from day one" },
      { zh: "周末双休，弹性打卡（09:30–10:30 / 18:30–19:30）", en: "Weekends off with flexible hours (09:30–10:30 / 18:30–19:30)" },
      { zh: "带薪年假与法定节假日，扁平高效的工程师文化", en: "Paid leave, public holidays, and a flat, focused engineering culture" }
    ],
    postedAt: "2026-08-27",
    status: "open"
  },
  {
    id: "hardware-engineer",
    title: { zh: "硬件工程师", en: "Hardware Engineer" },
    team: { zh: "硬件研发", en: "Hardware Engineering" },
    location: { zh: "深圳 · 全职 · 提供实习岗位", en: "Shenzhen · Full-time · Internships available" },
    type: { zh: "薪资面议", en: "Compensation discussed during the process" },
    summary: {
      zh: "主导消费电子产品从硬件方案设计到量产落地的全过程。",
      en: "Lead consumer electronics hardware from initial design through mass production."
    },
    responsibilities: [
      { zh: "主导消费电子产品从硬件方案设计、原理图和 PCB Layout，到样机调试、试产及量产的全过程。", en: "Lead consumer electronics hardware from architecture, schematics, and PCB layout through debugging, pilot production, and mass production." },
      { zh: "独立完成原理图设计和 PCB Layout，并配合嵌入式工程师完成软硬件联调。", en: "Independently complete schematic design and PCB layout, and work with embedded engineers on hardware and firmware integration." },
      { zh: "独立完成样机 Bring-up、故障定位和失效分析，解决产品研发过程中的硬件问题。", en: "Independently bring up prototypes, diagnose faults, perform failure analysis, and resolve hardware issues during development." },
      { zh: "跟进产品试产，定位并解决硬件问题，推动产品顺利进入量产。", en: "Follow pilot production, identify and resolve hardware issues, and move products smoothly into mass production." },
      { zh: "与结构、工厂及测试团队协作，完成产品验证和生产落地。", en: "Work with mechanical, factory, and test teams to complete product validation and production delivery." }
    ],
    requirements: [
      { zh: "具备 2–5 年消费电子产品硬件开发经验，至少完整负责过 1–2 款产品。", en: "2–5 years of consumer electronics hardware development experience, with end-to-end ownership of at least one or two products." },
      { zh: "熟悉 MCU、模拟与数字电路、电源与锂电池、USB / Type-C 及传感器相关设计。", en: "Familiar with MCU systems, analog and digital circuits, power and lithium battery design, USB / Type-C, and sensors." },
      { zh: "能够独立完成硬件方案、原理图设计和 PCB Layout。", en: "Able to independently complete hardware architecture, schematic design, and PCB layout." },
      { zh: "熟练使用示波器、逻辑分析仪等常用调试设备。", en: "Proficient with oscilloscopes, logic analyzers, and other common debugging equipment." },
      { zh: "能够独立完成样机 Bring-up、故障定位和失效分析。", en: "Able to independently complete prototype bring-up, troubleshooting, and failure analysis." },
      { zh: "学历和专业不作硬性限制，以实际能力和项目经验为主要判断依据。", en: "No strict degree or major requirement; practical ability and project experience are the primary considerations." }
    ],
    niceToHave: [
      { zh: "具备电机驱动、屏幕或音频相关产品开发经验。", en: "Experience developing products involving motor drives, displays, or audio." },
      { zh: "具备解决 PCBA 异常、改善生产良率或处理替代料的经验。", en: "Experience resolving PCBA issues, improving production yield, or handling alternative components." },
      { zh: "具备 BOM 成本控制或生产测试方案设计经验。", en: "Experience with BOM cost control or production test planning." },
      { zh: "具备 EMC / ESD 整改经验。", en: "Experience with EMC / ESD troubleshooting and remediation." },
      { zh: "参与过 3C、CE、FCC、RoHS 等产品认证。", en: "Experience supporting product certifications such as 3C, CE, FCC, or RoHS." }
    ],
    tags: [
      { zh: "硬件研发", en: "Hardware engineering" },
      { zh: "消费电子", en: "Consumer electronics" },
      { zh: "电路 / PCB", en: "Circuit / PCB design" },
      { zh: "量产 / DFM", en: "Manufacturing / DFM" }
    ],
    benefits: [
      { zh: "薪资面议", en: "Compensation discussed during the process" },
      { zh: "入职即缴纳五险一金", en: "Statutory benefits from day one" },
      { zh: "周末双休，弹性打卡（09:30–10:30 / 18:30–19:30）", en: "Weekends off with flexible hours (09:30–10:30 / 18:30–19:30)" },
      { zh: "带薪年假与法定节假日", en: "Paid annual leave and public holidays" }
    ],
    postedAt: "2026-08-31",
    status: "open"
  },
  {
    id: "robotics-embedded-intern",
    title: { zh: "机器人 / 嵌入式实习生", en: "Robotics / Embedded Engineering Intern" },
    team: { zh: "嵌入式与机器人", en: "Embedded Systems & Robotics" },
    location: { zh: "深圳 · 实习", en: "Shenzhen · Internship" },
    type: { zh: "实习岗位", en: "Internship" },
    summary: {
      zh: "参与真实硬件项目，在开发、调试和验证中把基础打扎实。",
      en: "Build strong fundamentals through hands-on development, debugging, and validation on real hardware."
    },
    responsibilities: [
      { zh: "协助完成电子模块、执行器和机器人原型的嵌入式开发、调试与测试。", en: "Support embedded development, debugging, and testing for electronic modules, actuators, and robotic prototypes." },
      { zh: "参与 MCU 外设、传感器、电机及 UART / I2C / SPI / CAN 等接口联调。", en: "Work with MCU peripherals, sensors, motors, and interfaces such as UART, I2C, SPI, and CAN." },
      { zh: "编写简单的测试程序和脚本，记录问题、测试结果与解决过程。", en: "Write basic test firmware and scripts, and document issues, results, and fixes." },
      { zh: "配合硬件、结构和软件团队完成样机装配、功能验证和版本迭代。", en: "Collaborate with hardware, mechanical, and software teams on prototype assembly, validation, and iteration." }
    ],
    requirements: [
      { zh: "电子信息、自动化、计算机、机械电子或相关专业本科及以上在读。", en: "Currently pursuing a bachelor's degree or above in electronics, automation, computer science, mechatronics, or a related field." },
      { zh: "具备 C / C++ 基础，做过 MCU 或嵌入式课程、竞赛或个人项目。", en: "Foundational C / C++ skills and experience with an MCU or embedded course, competition, or personal project." },
      { zh: "了解常见数字电路和通信接口，能够阅读基础原理图与芯片手册。", en: "Basic knowledge of digital circuits and communication interfaces, with the ability to read schematics and datasheets." },
      { zh: "愿意动手调试，能够清楚记录问题并主动沟通进度。", en: "Hands-on, methodical in documenting problems, and proactive in communicating progress." }
    ],
    niceToHave: [
      { zh: "使用过 STM32、ESP32、Arduino 或其他 MCU 平台。", en: "Experience with STM32, ESP32, Arduino, or another MCU platform." },
      { zh: "接触过 FreeRTOS、电机控制、机器人项目、Python 测试脚本或基础焊接。", en: "Exposure to FreeRTOS, motor control, robotics projects, Python test scripts, or basic soldering." }
    ],
    tags: [
      { zh: "实习", en: "Internship" },
      { zh: "嵌入式系统", en: "Embedded systems" },
      { zh: "机器人", en: "Robotics" },
      { zh: "MCU / C++", en: "MCU / C++" }
    ],
    benefits: [
      { zh: "在工程师指导下参与真实产品研发，不做纯演示项目", en: "Contribute to real product development with direct engineering mentorship" },
      { zh: "实习薪资、到岗时间与实习周期面试时沟通", en: "Internship compensation, start date, and duration discussed during the interview" },
      { zh: "深圳办公，与硬件、软件、结构团队协作", en: "Based in Shenzhen and working across hardware, software, and mechanical teams" }
    ],
    postedAt: "2026-08-31",
    status: "open"
  },
];

export const CAREER_FILTERS: CareerText[] = [
  { zh: "全部岗位", en: "All roles" }
];
