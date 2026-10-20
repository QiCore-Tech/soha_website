
import { messages } from "@/i18n/messages";
import type { CareerRole, CareerText } from "./careers-data";

// Local-development preview data, loaded only by the fallback in getCareerRoles.
// It mirrors the current real openings so the page can be reviewed offline.
// Production never reads this file: it is gated to unconfigured local dev, and
// the Vercel production path still refuses to publish without real Feishu data.
const COMPENSATION: CareerText = messages.careersLocalSample.compensationDiscussed;

const COMMON_BENEFITS: CareerText[] = [
  COMPENSATION,
  messages.careersLocalSample.fullSocialInsuranceAndHousingFundFrom,
  messages.careersLocalSample.fiveDayWorkWeekWithFlexibleClock,
  messages.careersLocalSample.paidAnnualLeaveAndPublicHolidays
];

export const LOCAL_CAREER_SAMPLES: CareerRole[] = [
  {
    id: "structural-engineer",
    title: messages.careersLocalSample.structuralEngineer,
    team: messages.careersLocalSample.structureManufacturing,
    location: messages.careersLocalSample.shenzhenFullTimeInternshipsAvailable,
    type: COMPENSATION,
    summary: messages.careersLocalSample.fromConceptToMassProductionTurningA,
    responsibilities: [
      messages.careersLocalSample.ownProductStructuralDesignAndDevelopmentFrom,
      messages.careersLocalSample.produce2d3dEngineeringDrawingsAndBuild,
      messages.careersLocalSample.coordinateWithManufacturingAndSupplyChainPreparing,
      messages.careersLocalSample.takePartInPrototypingToolingPilotRuns,
      messages.careersLocalSample.continuouslyImproveStructuresAndProcessesToReduce
    ],
    requirements: [
      messages.careersLocalSample.bachelorSDegreeOrAboveInMechanical,
      messages.careersLocalSample.text25YearsOfStructuralDesignExperience,
      messages.careersLocalSample.proficientWith2d3dToolsSuchAs,
      messages.careersLocalSample.familiarWithPlasticsMetalAndSiliconePlus,
      messages.careersLocalSample.knowledgeableAboutProductSafetyAndEnvironmentalRequirements
    ],
    niceToHave: [
      messages.careersLocalSample.aSolidUnderstandingOfProductLifecycleManagement,
      messages.careersLocalSample.skilledAtBreakingDownComplexProblemsAnd
    ],
    benefits: [
      COMMON_BENEFITS[0],
      COMMON_BENEFITS[1],
      COMMON_BENEFITS[2],
      messages.careersLocalSample.paidAnnualLeaveAndPublicHolidaysWith
    ],
    tags: [
      messages.careersLocalSample.mechanicalDesign,
      messages.careersLocalSample.productEngineering,
      messages.careersLocalSample.manufacturingDfm
    ],
    postedAt: "2026-08-26",
    status: "open"
  },
  {
    id: "hardware-engineer",
    title: messages.careersLocalSample.hardwareEngineer,
    team: messages.careersLocalSample.hardwareEngineering,
    location: messages.careersLocalSample.shenzhenFullTimeInternshipsAvailable,
    type: COMPENSATION,
    summary: messages.careersLocalSample.ownConsumerElectronicsHardwareFromArchitectureSchematics,
    responsibilities: [
      messages.careersLocalSample.leadConsumerElectronicsHardwareFromArchitectureSchematics,
      messages.careersLocalSample.designSelectAndValidateCircuitBlocksIncluding,
      messages.careersLocalSample.bringUpPrototypesDebugHardwareIsolateFaults,
      messages.careersLocalSample.followUpOnPilotBuildsAndWork,
      messages.careersLocalSample.maintainSchematicsPcbFilesBomsTestReports
    ],
    requirements: [
      messages.careersLocalSample.bachelorSDegreeOrAboveElectronicsAutomation,
      messages.careersLocalSample.text25YearsOfConsumerElectronicsHardware,
      messages.careersLocalSample.ableToIndependentlyDeliverHardwareArchitectureSchematic,
      messages.careersLocalSample.familiarWithAnalogAndDigitalCircuitsPower,
      messages.careersLocalSample.proficientWithOscilloscopesLogicAnalyzersAndMultimeters,
      messages.careersLocalSample.skilledAtHandSolderingAndReworkIncluding,
      messages.careersLocalSample.aHardwareInternshipIsAlsoOpenInterns
    ],
    niceToHave: [
      messages.careersLocalSample.experienceDevelopingOrDebuggingDdr3Ddr4Lpddr,
      messages.careersLocalSample.experienceWithMotorDriveDisplayOrAudio,
      messages.careersLocalSample.experienceWithPcbaIssueHandlingYieldImprovement,
      messages.careersLocalSample.experienceWithEmcEsdRemediationAndCertifications,
      messages.careersLocalSample.experienceInRobomasterRoboconOrOtherRobotics
    ],
    benefits: COMMON_BENEFITS,
    tags: [
      messages.careersLocalSample.hardwareEngineering,
      messages.careersLocalSample.circuitPcbDesign,
      messages.careersLocalSample.consumerElectronics,
      messages.careersLocalSample.internship
    ],
    postedAt: "2026-08-30",
    status: "open"
  },
  {
    id: "full-stack-engineer",
    title: messages.careersLocalSample.fullStackSoftwareEngineer,
    team: messages.careersLocalSample.softwarePlatform,
    location: messages.careersLocalSample.shenzhenFullTimeInternshipsAvailable,
    type: COMPENSATION,
    summary: messages.careersLocalSample.buildTheOyscatWebWorkspaceAndCompanion,
    responsibilities: [
      messages.careersLocalSample.contributeToTheOyscatWebWorkspaceAnd,
      messages.careersLocalSample.designAndBuildFrontendAndBackendFeatures,
      messages.careersLocalSample.helpImplementWeb3dScenesInteractiveTools,
      messages.careersLocalSample.useAiAndAgentsForTaskBreakdown,
      messages.careersLocalSample.workWithProductDesignEmbeddedMechanicalAnd
    ],
    requirements: [
      messages.careersLocalSample.handsOnFullStackExperienceWithTypescript,
      messages.careersLocalSample.web3dExperienceAbleToContributeTo,
      messages.careersLocalSample.ableToIndependentlyDesignAndBuildModules,
      messages.careersLocalSample.comfortableUsingAiCodingToolsDailyBreaking,
      messages.careersLocalSample.noFixedYearsOfExperienceWeValue
    ],
    niceToHave: [
      messages.careersLocalSample.familiarityWithThreeJsReactThreeFiber,
      messages.careersLocalSample.experienceWithWebsocketMqttSerialBluetoothOr,
      messages.careersLocalSample.experienceBuildingConsumerElectronicsSmartHardwareCreation,
      messages.careersLocalSample.practicalExperienceUsingAiToImproveTesting
    ],
    benefits: [
      messages.careersLocalSample.fiveDayWorkWeekWithFlexibleHours,
      messages.careersLocalSample.fullSocialInsuranceAndHousingFundFrom2,
      messages.careersLocalSample.paidAnnualLeaveAndPublicHolidays2,
      messages.careersLocalSample.flatCollaborationThatValuesEngineeringAndReal
    ],
    tags: [
      messages.careersLocalSample.smartHardware,
      messages.careersLocalSample.fullStackEngineering,
      messages.careersLocalSample.internship
    ],
    postedAt: "2026-08-30",
    status: "open"
  },
  {
    id: "embedded-engineer",
    title: messages.careersLocalSample.embeddedEngineer,
    team: messages.careersLocalSample.embeddedSystemsRobotics,
    location: messages.careersLocalSample.shenzhenFullTime,
    type: COMPENSATION,
    summary: messages.careersLocalSample.workOnEmbeddedSoftwareAndHardwareFor,
    responsibilities: [
      messages.careersLocalSample.designDevelopDebugAndMaintainMcuFirmware,
      messages.careersLocalSample.developDriversAndRunHardwareSoftwareIntegration,
      messages.careersLocalSample.developAndDebugCommonMcuPeripheralsSuch,
      messages.careersLocalSample.bringUpNewHardwarePlatformsAndValidate,
      messages.careersLocalSample.useOscilloscopesLogicAnalyzersAndRelatedTools,
      messages.careersLocalSample.takePartInSystemIntegrationPrototypeDebugging,
      messages.careersLocalSample.writeTestProgramsAndWhereUsefulAutomated,
      messages.careersLocalSample.collaborateWithHardwareMechanicalAndApplicationSoftware
    ],
    requirements: [
      messages.careersLocalSample.bachelorSDegreeOrAboveInElectronics,
      messages.careersLocalSample.solidCFundamentalsAndAGraspOf,
      messages.careersLocalSample.handsOnMcuProjectExperienceAbleTo,
      messages.careersLocalSample.familiarWithCommonMcuPeripheralsSuchAs,
      messages.careersLocalSample.ableToReadSchematicsAndConfigurePeripherals,
      messages.careersLocalSample.skilledWithOscilloscopesLogicAnalyzersAndBasic,
      messages.careersLocalSample.understandInterruptsDmaMemoryBootFlowLinking,
      messages.careersLocalSample.basicRtosExperienceUnderstandingTasksSchedulingSynchronization,
      messages.careersLocalSample.strongEngineeringDebuggingSkillsReproduceAnalyzeAnd,
      messages.careersLocalSample.familiarWithEmbeddedToolchainsSuchAsGit
    ],
    niceToHave: [
      messages.careersLocalSample.handsOnExperienceWithMcuSocPlatforms,
      messages.careersLocalSample.experienceWithRustEmbeddedNoStdDevelopment,
      messages.careersLocalSample.familiarityWithRtosSuchAsFreertosZephyr,
      messages.careersLocalSample.experienceWithMotorControlRoboticsEncodersSensors,
      messages.careersLocalSample.basicSolderingJumperWireHardwareModificationAnd
    ],
    benefits: COMMON_BENEFITS,
    tags: [
      messages.careersLocalSample.embeddedSystems,
      messages.careersLocalSample.mcuC,
      messages.careersLocalSample.robotics
    ],
    postedAt: "2026-09-03",
    status: "open"
  },
  {
    id: "test-development-engineer",
    title: messages.careersLocalSample.testDevelopmentEngineer,
    team: messages.careersLocalSample.hardwareEngineering,
    location: messages.careersLocalSample.shenzhenFullTime,
    type: COMPENSATION,
    summary: messages.careersLocalSample.ownTestDevelopmentAndQualitySystemsFor,
    responsibilities: [
      messages.careersLocalSample.testTheOyscatWebWorkspaceQicoreElectronic,
      messages.careersLocalSample.joinRequirementReviewsToAdviseOnTestability,
      messages.careersLocalSample.driveBuildingTheTestProcessAndQuality,
      messages.careersLocalSample.writeAndMaintainAutomatedTestScriptsTo,
      messages.careersLocalSample.developAndMaintainTestToolingForTest,
      messages.careersLocalSample.workWithProductSoftwareEmbeddedAndHardware,
      messages.careersLocalSample.asProductsMoveTowardProductionHelpBuild
    ],
    requirements: [
      messages.careersLocalSample.handsOnTestingOrTestDevelopmentExperience,
      messages.careersLocalSample.familiarWithTestCaseDesignDefectManagement,
      messages.careersLocalSample.ableToWriteDebugAndMaintainAutomated,
      messages.careersLocalSample.practicalExperienceTestingWebAppsEmbeddedDevices,
      messages.careersLocalSample.troubleshootUsingLogsApiResponsesDeviceState,
      messages.careersLocalSample.comfortableUsingAiCodingToolsAndAgents,
      messages.careersLocalSample.strongQualityMindsetAndCrossTeamCommunication
    ],
    niceToHave: [
      messages.careersLocalSample.experienceBuildingTestProcessesAndQualitySystems,
      messages.careersLocalSample.experienceTestingBothWebSoftwareAndHardware,
      messages.careersLocalSample.ableToIndependentlyBuildTestPlatformsTools,
      messages.careersLocalSample.experienceWithDeviceCommunicationLongRunFault,
      messages.careersLocalSample.experienceWithProductionLineTestingTestFixtures,
      messages.careersLocalSample.practicalExperienceIntegratingAutomatedTestsIntoCi
    ],
    benefits: [
      messages.careersLocalSample.theTeamWillCollaborateToSupportBuilding
    ],
    tags: [
      messages.careersLocalSample.testDevelopment,
      messages.careersLocalSample.smartHardware,
      messages.careersLocalSample.qualitySystems
    ],
    postedAt: "2026-09-09",
    status: "open"
  },
  {
    id: "product-marketing-specialist-north-america",
    title: messages.careersLocalSample.productMarketingSpecialistNorthAmerica,
    team: messages.careersLocalSample.marketingGrowth,
    location: messages.careersLocalSample.shenzhenFullTime,
    type: COMPENSATION,
    summary: messages.careersLocalSample.pmmSummary,
    responsibilities: [
      messages.careersLocalSample.pmmResponsibility1,
      messages.careersLocalSample.pmmResponsibility2,
      messages.careersLocalSample.pmmResponsibility3,
      messages.careersLocalSample.pmmResponsibility4,
      messages.careersLocalSample.pmmResponsibility5
    ],
    requirements: [
      messages.careersLocalSample.pmmRequirement1,
      messages.careersLocalSample.pmmRequirement2,
      messages.careersLocalSample.pmmRequirement3,
      messages.careersLocalSample.pmmRequirement4,
      messages.careersLocalSample.pmmRequirement5
    ],
    niceToHave: [
      messages.careersLocalSample.pmmNiceToHave1,
      messages.careersLocalSample.pmmNiceToHave2,
      messages.careersLocalSample.pmmNiceToHave3
    ],
    benefits: COMMON_BENEFITS,
    tags: [
      messages.careersLocalSample.productMarketing,
      messages.careersLocalSample.overseasGrowth,
      messages.careersLocalSample.northAmericaMarket
    ],
    postedAt: "2026-10-19",
    status: "open"
  }
];

// Backwards-compatible single-fixture export.
export const LOCAL_CAREER_SAMPLE = LOCAL_CAREER_SAMPLES[0];
