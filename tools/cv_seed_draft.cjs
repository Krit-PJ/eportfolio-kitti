#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const API_URL = process.env.API_URL;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const APPLY = process.argv.includes('--apply');
const UPLOAD_IMAGES = process.argv.includes('--upload-images');
const assetDir = path.resolve(__dirname, '..', 'assets', 'cv-evidence');

if (!API_URL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('Set API_URL, ADMIN_USERNAME and ADMIN_PASSWORD environment variables.');
  process.exit(2);
}

const draft = { Status:'draft' };
const records = {
  Dashboards: [
    { Title:'ระบบสารสนเทศทางการเกษตรที่สำคัญในรูปแบบ Data Visualization จังหวัดกำแพงเพชร ปี 2565', Description:'การจัดระบบและนำเสนอข้อมูลการเกษตรที่สำคัญของจังหวัดกำแพงเพชรในรูปแบบ Data Visualization เพื่อสนับสนุนการสื่อสารและการตัดสินใจ', Category:'Agricultural Data Visualization', Tags:'Data Visualization,ข้อมูลการเกษตร,กำแพงเพชร', Featured:'false', AccessNote:'ข้อมูลตั้งต้นจาก CV ลงวันที่ 9 กรกฎาคม 2567', SortOrder:10, ...draft }
  ],
  Research: [
    { Title:'การศึกษาแนวทางการพัฒนากระบวนการผลิตและยกระดับคุณภาพผลผลิตกล้วยไข่กำแพงเพชร', Abstract:'ผลงานวิจัยในงานประจำของสำนักงานเกษตรจังหวัดกำแพงเพชร', Year:2565, Field:'Routine to Research (R2R)', Authors:'กิตติ โพธิ์จวง', Tags:'R2R,กล้วยไข่,กำแพงเพชร', ...draft },
    { Title:'แนวทางการจัดการกล้วยไข่กำแพงเพชรให้ได้คุณภาพ', Abstract:'ผลงาน R2R จากการปฏิบัติงานในสังกัดกรมส่งเสริมการเกษตร', Year:2564, Field:'Agricultural Extension', Authors:'กิตติ โพธิ์จวง', Tags:'R2R,กล้วยไข่,คุณภาพผลผลิต', ...draft },
    { Title:'การพัฒนา Chemical Sensor System for Precision Agriculture (ChemSenSys-PA)', Abstract:'ระบบเซ็นเซอร์ทางเคมีสำหรับเกษตรแม่นยำ ทดลองใช้กับแปลงสาธิตข้าว ข้าวโพด และเมล่อนในจังหวัดเชียงใหม่และพะเยา', Year:2563, Field:'Precision Agriculture', Authors:'กิตติ โพธิ์จวง และคณะ', Tags:'Chemical Sensor,Precision Agriculture,ChemSenSys-PA', ...draft },
    { Title:'การศึกษาความเข้มข้นของสารอินทรีย์ระเหยง่ายในพื้นที่สวนยางพาราที่ระดับความสูงแตกต่างกัน', Abstract:'Study of Volatile Organic Compounds from Rubber Plantation Area at Different Height Levels; บทบาทอาจารย์ที่ปรึกษาวิจัยร่วม', Year:2566, Field:'Environmental Science', Authors:'มหาวิทยาลัยราชภัฏอุดรธานี; ที่ปรึกษาร่วม ดร.กิตติ โพธิ์จวง', Tags:'VOC,สวนยางพารา,สิ่งแวดล้อม', ...draft }
  ],
  Publications: [
    { Title:'Cost-Effective Modern Chemical Sensor System for Soil Macronutrient Analysis Applied to Thai Sustainable and Precision Agriculture', Type:'Journal', Authors:'Sutasinee Apichai, Chalermpong Saenjum, Thanawat Pattananandecha, Kitti Phojuang, Siraprapa Wattanakul, Kanokwan Kiwfo, Attachai Jintrawet, Kate Grudpan', Source:'Plants 10, 1524', Year:2021, DOI_URL:'', Tags:'chemical sensor,soil macronutrient,precision agriculture', ...draft },
    { Title:'Simple Cost-Effective Sequential Injection Lab at Valve with Remote Control Employing Everyday Communication Technology with a Webcam Camera Detector for the Determination of Iron and Phosphate as Model Analytes', Type:'Journal', Authors:'Wasin Wongwilai, Kanokwan Kiwfo, Kitti Phojuang, Narong Kotchabhakdi, Pathinan Paengnakorn, Kate Grudpan', Source:'CMU Journal of Natural Sciences 19(4), 917–929', Year:2020, DOI_URL:'', Tags:'sequential injection,remote control,webcam detector', ...draft },
    { Title:'SMART LABORATORY INFORMATION SYSTEM FOR WATER QUALITY MONITORING', Type:'Journal', Authors:'Kitti Phojuang, Siraprapa Wattanakul, Supara Grudpan, Wasin Wongwilai, Kate Grudpan', Source:'PARIPEX - Indian Journal of Research 7(12), 26–29', Year:2018, DOI_URL:'', Tags:'laboratory information system,water quality', ...draft },
    { Title:'Simple Natural Material Based Microfluidic Platforms with a Smartphone Detection Employing Natural Reagent for Acidity Assay', Type:'Journal', Authors:'Kanokwan Kiwfo, Wasin Wongwilai, Tadao Sakai, Norio Teshima, Hiroya Murakami, Pathinan Paengnakorn, Kitti Phojuang, Narong Kotchabhakdi, Kate Grudpan', Source:'Journal of Flow Injection Analysis 37(1), 9–12', Year:2020, DOI_URL:'', Tags:'microfluidic,smartphone,acidity assay', ...draft },
    { Title:'Study of atmospheric stability in Bangkok Mass Transit System (BTS) area by meteorological pre-processor model', Type:'Conference', Authors:'Kitti Phojuang, Prapassara Nilagupta, Surat Baulert, Bongkotrat Pitiyon', Source:'Proceedings of 45th Kasetsart University Annual Conference, pp.755–762', Year:2007, DOI_URL:'', Tags:'atmospheric stability,BTS,meteorological model', ...draft },
    { Title:'ระบบตรวจวัดการเปลี่ยนแปลงทางเคมี', Type:'Petty Patent', Authors:'กิตติ โพธิ์จวง และคณะ', Source:'อนุสิทธิบัตรเลขที่ 19843', Year:'', DOI_URL:'', Tags:'อนุสิทธิบัตร,chemical sensing', ...draft },
    { Title:'Simple Chemical Sensor Systems (CSSs) developed for sustainable agriculture', Type:'Conference', Authors:'Kitti Phojuang et al.', Source:'One-Day E-Symposium on Green Innovation in Chemical Analysis', Year:2021, DOI_URL:'', Tags:'CSS,sustainable agriculture', ...draft },
    { Title:'Internet of Things (IoT) bridging chemical analysis for agriculture: Experiences in Chiang Mai', Type:'Conference', Authors:'Kitti Phojuang, Wasin Wongwilai, Kate Grudpan', Source:'21st ICFIA, Saint Petersburg, Russia', Year:2017, DOI_URL:'', Tags:'IoT,chemical analysis,agriculture', ...draft },
    { Title:'Internet of Things (IoT) in Modern Chemical Analysis', Type:'Conference', Authors:'Kitti Phojuang, Wasin Wongwilai, Supara Grudpan, Siraprapa Wattanakul, Kate Grudpan', Source:'ASIANALYSIS XIII, Chiang Mai', Year:2016, DOI_URL:'', Tags:'IoT,chemical analysis', ...draft },
    { Title:'Modern chemical analysis employing PiCOEXPLORER and modern information technology', Type:'Conference', Authors:'Kitti Phojuang et al.', Source:'International Forum 2016 on I&E Sensing Technology & Environment Monitoring, Kyushu University', Year:2016, DOI_URL:'', Tags:'PiCOEXPLORER,environment monitoring', ...draft },
    { Title:'Down scaling chemical analysis employing PiCOSCOPE and modern information technology', Type:'Conference', Authors:'Kanokwan Kiwfo et al.; Kitti Phojuang', Source:'52nd JAFIA Annual Symposium, Kiryu, Japan', Year:2015, DOI_URL:'', Tags:'PiCOSCOPE,chemical analysis', ...draft },
    { Title:'Modern information technology for Environmental Analysis: Green analytical chemistry', Type:'Conference', Authors:'Wasin Wongwilai et al.; Kitti Phojuang', Source:'International Symposia on Research toward Green Innovation, Chiang Mai', Year:2014, DOI_URL:'', Tags:'environmental analysis,green chemistry', ...draft },
    { Title:'Analytical Chemistry Made Easy with Every Day Modern IT for Flow Based and Down Scaling Analysis', Type:'Conference', Authors:'Wasin Wongwilai, Kitti Phojuang, Siraprapa Wattanakul, Supara Grudpan, Kate Grudpan', Source:'ICFIA 2014, Fukuoka, Japan', Year:2014, DOI_URL:'', Tags:'analytical chemistry,modern IT', ...draft },
    { Title:'Novel Water Quality Monitoring Employing Modern Information Technology: Study Cases in Thailand', Type:'Conference', Authors:'W. Wongwilai, Kitti Phojuang, I. D. McKelvie, Kate Grudpan', Source:'Asianalysis XII 2013, Fukuoka, Japan', Year:2013, DOI_URL:'', Tags:'water quality,modern IT', ...draft },
    { Title:'Novel Water Quality Monitoring Approach By Employing Modern Information Technology: A Case Study For The Effects Due To Flooding In Thailand', Type:'Conference', Authors:'Kitti Phojuang, Wasin Wongwilai, Somchai Lapanantnoppakhun, Ian D McKelvie, Kate Grudpan', Source:'6th PACCON 2012, Chiang Mai', Year:2012, DOI_URL:'', Tags:'water quality,flooding,modern IT', ...draft }
  ],
  Projects: [
    { Title:'การส่งเสริมการจัดการน้ำและธาตุอาหารพืชด้วยระบบสมาร์ทฟาร์ม จังหวัดกำแพงเพชร', Description:'แนวคิดปี 2565 เพื่อส่งเสริมการจัดการน้ำและธาตุอาหารพืชอย่างมีประสิทธิภาพด้วยระบบสมาร์ทฟาร์ม', Category:'Smart Farming', YearStart:2565, YearEnd:2565, IsInnovation:'true', Role:'ผู้เสนอแนวคิด', Area:'จังหวัดกำแพงเพชร', ...draft },
    { Title:'การขับเคลื่อนงานส่งเสริมการเกษตรด้วยระบบออนไลน์ในสถานการณ์ COVID-19', Description:'กรณีศึกษาโครงการพัฒนานักส่งเสริมการเกษตรมืออาชีพ ปี 2564', Category:'Agricultural Extension', YearStart:2564, YearEnd:2564, IsInnovation:'true', Role:'ผู้พัฒนาผลงาน', Area:'จังหวัดกำแพงเพชร', ...draft },
    { Title:'การศึกษาธาตุอาหารพืชหลัก N P K ด้วยวิธี CSS-A และการพัฒนาระบบจัดเตรียมสารละลายปุ๋ยน้ำอัตโนมัติ', Description:'ศึกษาความเป็นกรด-ด่าง ค่าการนำไฟฟ้า และธาตุอาหารพืช พร้อมพัฒนาระบบอัตโนมัติ', Category:'Precision Agriculture', YearStart:2562, YearEnd:2563, IsInnovation:'true', Role:'ผู้รับผิดชอบโครงการ', Area:'มหาวิทยาลัยเกษตรศาสตร์และพื้นที่ทดลอง', ...draft },
    { Title:'ถ่ายทอดระบบเซ็นเซอร์ทางเคมีสำหรับเกษตรแม่นยำเพื่อวิเคราะห์ธาตุอาหารพืชในดินแปลงนาข้าว', Description:'ถ่ายทอดองค์ความรู้และทดสอบระบบ CSS ร่วมกับศูนย์วิจัยข้าว กรมการข้าว', Category:'Precision Agriculture', YearStart:2562, YearEnd:2562, IsInnovation:'true', Role:'ผู้รับผิดชอบจัดประชุมเชิงปฏิบัติการ', Area:'ศูนย์วิจัยข้าว กรมการข้าว', ...draft },
    { Title:'การพัฒนาและประยุกต์ระบบเซ็นเซอร์ทางเคมีสำหรับเกษตรแม่นยำ จากข้อมูลเชิงจุดสู่ข้อมูลเชิงพื้นที่', Description:'โครงการตามสัญญาเลขที่ RDG6120019', Category:'Precision Agriculture', YearStart:2561, YearEnd:2562, IsInnovation:'true', Role:'ผู้ช่วยนักวิจัย', Area:'ประเทศไทย', ...draft },
    { Title:'การพัฒนาเซ็นเซอร์ทางเคมีเพื่อการวิเคราะห์ธาตุอาหารพืชในดินสำหรับเกษตรแบบแม่นยำ', Description:'โครงการตามสัญญาเลขที่ SRI5920209', Category:'Precision Agriculture', YearStart:2559, YearEnd:2560, IsInnovation:'true', Role:'ผู้ช่วยนักวิจัย', Area:'ประเทศไทย', ...draft }
  ],
  Career: [
    { Title:'นักวิชาการส่งเสริมการเกษตรชำนาญการ', Organization:'กลุ่มยุทธศาสตร์และสารสนเทศ สำนักงานเกษตรจังหวัดกำแพงเพชร กรมส่งเสริมการเกษตร', StartDate:'2020-09-01', EndDate:'', EvidenceURL:'', ...draft },
    { Title:'นักวิจัยหลังระดับปริญญาเอก', Organization:'โครงการเกี่ยวกับการเกษตร', StartDate:'2020-05-01', EndDate:'2020-06-30', EvidenceURL:'', ...draft },
    { Title:'ผู้รับผิดชอบโครงการศึกษาธาตุอาหารพืชหลักและระบบจัดเตรียมสารละลายปุ๋ยน้ำอัตโนมัติ', Organization:'มหาวิทยาลัยเกษตรศาสตร์', StartDate:'2019-11-01', EndDate:'2020-01-31', EvidenceURL:'', ...draft },
    { Title:'ผู้รับผิดชอบจัดประชุมเชิงปฏิบัติการถ่ายทอดระบบเซ็นเซอร์ทางเคมีสำหรับเกษตรแม่นยำ', Organization:'ศูนย์วิจัยข้าว กรมการข้าว', StartDate:'2019-02-01', EndDate:'2019-10-31', EvidenceURL:'', ...draft },
    { Title:'ผู้ช่วยนักวิจัย โครงการพัฒนาและประยุกต์ระบบเซ็นเซอร์ทางเคมีสำหรับเกษตรแม่นยำ', Organization:'โครงการ RDG6120019', StartDate:'2018-02-01', EndDate:'2019-01-31', EvidenceURL:'', ...draft },
    { Title:'ผู้ช่วยนักวิจัย โครงการพัฒนาเซ็นเซอร์ทางเคมีเพื่อวิเคราะห์ธาตุอาหารพืชในดิน', Organization:'โครงการ SRI5920209', StartDate:'2016-09-01', EndDate:'2017-08-31', EvidenceURL:'', ...draft }
  ],
  Expertise: [
    { Name:'Agricultural Data & Visualization', ParentID:'', Level:'2', Category:'ข้อมูลและแผนที่', Description:'การพัฒนาระบบสารสนเทศทางการเกษตรและ Data Visualization เพื่อสนับสนุนการตัดสินใจ', Icon:'fa-chart-area', Color:'#0F6B78', LinkTarget:'dashboards', SortOrder:1, ...draft },
    { Name:'Smart Farming & IoT', ParentID:'', Level:'2', Category:'เกษตรอัจฉริยะ', Description:'การประยุกต์ Internet of Things และระบบเซ็นเซอร์เพื่อเกษตรแม่นยำ', Icon:'fa-satellite-dish', Color:'#2E7D32', LinkTarget:'dashboards', SortOrder:2, ...draft },
    { Name:'Agricultural Extension & R2R', ParentID:'', Level:'2', Category:'ส่งเสริมการเกษตร', Description:'การพัฒนางานส่งเสริมการเกษตรจากงานประจำสู่งานวิจัย', Icon:'fa-seedling', Color:'#558B2F', LinkTarget:'training', SortOrder:3, ...draft },
    { Name:'Environmental & Risk Science', ParentID:'', Level:'2', Category:'วิทยาศาสตร์สิ่งแวดล้อม', Description:'การตรวจวัดสิ่งแวดล้อม การประเมินความเสี่ยง และอาชีวอนามัย', Icon:'fa-earth-asia', Color:'#0277BD', LinkTarget:'research', SortOrder:4, ...draft },
    { Name:'Research & Digital Innovation', ParentID:'', Level:'2', Category:'วิจัยและนวัตกรรม', Description:'การออกแบบงานวิจัยและพัฒนานวัตกรรมดิจิทัลจากปัญหาในพื้นที่', Icon:'fa-flask-vial', Color:'#6A4C93', LinkTarget:'research', SortOrder:5, ...draft },
    { Name:'Training & Knowledge Transfer', ParentID:'', Level:'2', Category:'พัฒนาคน', Description:'การเป็นวิทยากร พี่เลี้ยง และถ่ายทอดองค์ความรู้', Icon:'fa-chalkboard-user', Color:'#B26A00', LinkTarget:'training', SortOrder:6, ...draft }
  ],
  Blog: [
    { Title:'จากระบบเซ็นเซอร์ทางเคมี สู่งานส่งเสริมการเกษตรเชิงข้อมูล', Slug:'chemical-sensor-to-data-driven-extension', Excerpt:'เส้นทางการทำงานที่เชื่อมวิทยาศาสตร์สิ่งแวดล้อม ระบบเซ็นเซอร์ เกษตรแม่นยำ และการใช้ข้อมูลในพื้นที่', Content:'ข้อมูลจากประวัติการทำงานสะท้อนเส้นทางจากการพัฒนาระบบเซ็นเซอร์ทางเคมีและระบบสารสนเทศสำหรับการตรวจวัด สู่การประยุกต์ใช้กับเกษตรแม่นยำ การจัดการธาตุอาหารพืช และงานส่งเสริมการเกษตรระดับจังหวัด\n\nร่างเรื่องนี้จัดทำจาก Curriculum Vitae ลงวันที่ 9 กรกฎาคม 2567 และต้องตรวจทานก่อนเผยแพร่', ContentType:'เรื่องเล่าประสบการณ์', SourceType:'CV', SourceURL:'', Author:'ดร.กิตติ โพธิ์จวง', Category:'เส้นทางวิชาชีพ', Tags:'Chemical Sensor,Data Visualization,R2R,เกษตรแม่นยำ', PublishDate:'2024-07-09', ReadTime:4, Featured:'false', ...draft }
  ]
};

// The backend intentionally requires an evidence chain for every innovation.
// CV entries do not always state every field verbatim, so these are clearly
// labelled reviewable draft summaries rather than published claims.
records.Projects = records.Projects.map(project => ({
  Problem: project.Description,
  Hypothesis:'การนำข้อมูล เครื่องมือดิจิทัล หรือกระบวนการวิจัยมาปรับใช้กับบริบทพื้นที่จะช่วยให้การดำเนินงานมีประสิทธิภาพและตรวจสอบได้มากขึ้น (รอตรวจทาน)',
  Prototype:`ต้นแบบ/แนวทางปฏิบัติของโครงการ: ${project.Title} (รอตรวจทานรายละเอียด)`,
  TestMethod:'ทดลองหรือประยุกต์ใช้ตามพื้นที่และกลุ่มเป้าหมายที่ระบุใน CV พร้อมเก็บข้อมูลผลการดำเนินงาน (รอตรวจทาน)',
  Results:'CV ยืนยันการดำเนินโครงการ แต่ยังไม่มีค่าผลลัพธ์เชิงปริมาณครบถ้วน จึงยังไม่เผยแพร่เป็นข้อสรุป',
  NextStep:'ตรวจสอบเอกสารโครงการ เติมตัวชี้วัด ผลลัพธ์ และหลักฐานก่อนเปลี่ยนสถานะเป็นเผยแพร่',
  ...project
}));

const training = [
  ['ผ่านการเป็นคณะทำงานพี่เลี้ยง หลักสูตรนักส่งเสริมการเกษตรมืออาชีพ ปี 2566','Mentoring','คณะทำงานพี่เลี้ยง','2023-07-04','สำนักงานส่งเสริมและพัฒนาการเกษตรที่ 6 จังหวัดเชียงใหม่','mentor-2566.jpg'],
  ['ผ่านการฝึกอบรมหลักสูตรนักส่งเสริมการเกษตรมืออาชีพ ปี 2565','Training','ผู้ผ่านการฝึกอบรม','2022-08-20','สำนักงานส่งเสริมและพัฒนาการเกษตรที่ 6 จังหวัดเชียงใหม่','mentor-2565.jpg'],
  ['วิทยากรหลักสูตรการพัฒนางานส่งเสริมการเกษตรสู่งานวิจัย','Training','วิทยากร','2022-08-06','สำนักงานส่งเสริมและพัฒนาการเกษตรที่ 4 จังหวัดขอนแก่น','lecturer-research-2565.jpg'],
  ['วิทยากรหลักสูตรการพัฒนางานส่งเสริมการเกษตรด้วยวิธีการวิจัย ประจำปี 2566','Training','วิทยากร','2023-06-21','สำนักงานส่งเสริมและพัฒนาการเกษตรที่ 4 จังหวัดขอนแก่น','lecturer-research-method-2566.jpg'],
  ['การพัฒนาศักยภาพเจ้าหน้าที่เพื่อการเป็นพี่เลี้ยงที่ดี','Training','ผู้ผ่านการฝึกอบรม','2023-03-16','กรมส่งเสริมการเกษตร','good-mentor-2566.jpg'],
  ['การอบรมพัฒนาศักยภาพบุคลากรด้านอาชีพ หลักสูตรจิตวิทยาทางปัญญาเพื่อพัฒนานักวิชาชีพ','Training','ผู้ผ่านการฝึกอบรมออนไลน์','2023-09-29','กรมส่งเสริมการเกษตร','psychology-online-2566.jpg'],
  ['อาจารย์ที่ปรึกษาวิจัยร่วม: สารอินทรีย์ระเหยง่ายในพื้นที่สวนยางพารา','Mentoring','อาจารย์ที่ปรึกษาวิจัยร่วม','2023-03-14','มหาวิทยาลัยราชภัฏอุดรธานี','research-advisor-2566.jpg'],
  ['การสร้าง Growth Mindset เพื่อผลสำเร็จของชีวิตและงาน','Training','ผู้ผ่านการพัฒนาทางไกล','2023-03-02','สำนักงานคณะกรรมการข้าราชการพลเรือน','growth-mindset-2566.jpg'],
  ['Digital Literacy','Training','ผู้ผ่านการพัฒนาทางไกล','2021-10-17','สำนักงานคณะกรรมการข้าราชการพลเรือน','digital-literacy-2564.jpg'],
  ['Data Visualization','Training','ผู้ผ่านการพัฒนาทางไกล','2021-10-28','สำนักงานคณะกรรมการข้าราชการพลเรือน','data-visualization-2564.jpg'],
  ['Google Tools เพื่อการพัฒนางาน','Training','ผู้ผ่านการพัฒนาทางไกล','2021-10-19','สำนักงานคณะกรรมการข้าราชการพลเรือน','google-tools-2564.jpg'],
  ['การใช้ Microsoft Excel เพื่อการบริหารข้อมูล','Training','ผู้ผ่านการพัฒนาทางไกล','2023-03-29','สำนักงานคณะกรรมการข้าราชการพลเรือน','excel-data-2566.jpg'],
  ['The Fundamentals of Smart City','Training','ผู้ผ่านการอบรมและทดสอบ','2023-03-01','สำนักงานส่งเสริมเศรษฐกิจดิจิทัล','smart-city-2566.jpg']
].map(([Title,Type,Role,Date,Organizer,_file])=>({Title,Type,Role,Date,Organizer,CertificateFileID:'',SourceURL:'',Status:'draft',_file}));
records.Training = training;

function normalize(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
}
async function post(body) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status !== 'ok') throw new Error(json.message || `Request failed: ${body.action}`);
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}
async function uploadCertificate(token, filename) {
  const filePath = path.join(assetDir, filename);
  const base64 = fs.readFileSync(filePath).toString('base64');
  return post({action:'uploadFile',token,folderKey:'Gallery',filename:`CV-${filename}`,mimeType:'image/jpeg',base64});
}
async function seedRelationships(token, report) {
  const names = await post({action:'adminList',sheet:'Expertise',token,limit:500});
  const expertise = new Map((names.data || []).map(row => [normalize(row.Name),row]));
  const workCache = {};
  for (const sheet of ['Dashboards','Research','Publications','Projects','Training']) {
    const result = await post({action:'adminList',sheet,token,limit:500});
    workCache[sheet] = new Map((result.data || []).map(row => [normalize(row.Title),row]));
  }
  const relations = [
    ['Agricultural Data & Visualization','Dashboards',records.Dashboards[0].Title,'หลักฐานระบบข้อมูลการเกษตร'],
    ['Smart Farming & IoT','Projects',records.Projects[0].Title,'หลักฐานการประยุกต์ Smart Farm'],
    ['Agricultural Extension & R2R','Research',records.Research[0].Title,'หลักฐานงาน R2R จากโจทย์พื้นที่'],
    ['Environmental & Risk Science','Research',records.Research[3].Title,'หลักฐานงานวิจัยด้านสิ่งแวดล้อม'],
    ['Research & Digital Innovation','Publications',records.Publications[0].Title,'หลักฐานผลงานวิชาการ'],
    ['Training & Knowledge Transfer','Training',records.Training[0].Title,'หลักฐานการเป็นพี่เลี้ยงและถ่ายทอดความรู้']
  ];
  const existingRelations = await post({action:'adminList',sheet:'ExpertiseRelations',token,limit:500});
  const relationKeys = new Set((existingRelations.data || []).map(row => `${row.ExpertiseID}|${row.WorkType}|${row.WorkID}`));
  let relationCreated = 0;
  for (const [name,type,title,note] of relations) {
    const node = expertise.get(normalize(name));
    const work = workCache[type]?.get(normalize(title));
    if (!node || !work) continue;
    const key = `${node.ID}|${type}|${work.ID}`;
    if (relationKeys.has(key)) continue;
    if (APPLY) await post({action:'create',sheet:'ExpertiseRelations',token,data:{ExpertiseID:node.ID,WorkType:type,WorkID:work.ID,Weight:5,Note:note,Status:'draft'}});
    relationKeys.add(key); relationCreated += 1;
  }
  const linkSpecs = [
    ['Agricultural Data & Visualization','Smart Farming & IoT','applies'],
    ['Agricultural Data & Visualization','Research & Digital Innovation','supports'],
    ['Agricultural Extension & R2R','Training & Knowledge Transfer','supports'],
    ['Environmental & Risk Science','Research & Digital Innovation','supports']
  ];
  const existingLinks = await post({action:'adminList',sheet:'ExpertiseLinks',token,limit:500});
  const linkKeys = new Set((existingLinks.data || []).map(row => `${row.SourceExpertiseID}|${row.TargetExpertiseID}`));
  let linkCreated = 0;
  for (const [sourceName,targetName,type] of linkSpecs) {
    const source = expertise.get(normalize(sourceName));
    const target = expertise.get(normalize(targetName));
    if (!source || !target) continue;
    const key = `${source.ID}|${target.ID}`;
    if (linkKeys.has(key)) continue;
    if (APPLY) await post({action:'create',sheet:'ExpertiseLinks',token,data:{SourceExpertiseID:source.ID,TargetExpertiseID:target.ID,RelationType:type,Weight:4,Note:'ความเชื่อมโยงจากหลักฐานใน CV — รอตรวจทาน',Status:'draft'}});
    linkKeys.add(key); linkCreated += 1;
  }
  report.push({sheet:'ExpertiseRelations',existing:existingRelations.total,planned:relations.length,created:relationCreated,mode:APPLY?'apply':'dry-run'});
  report.push({sheet:'ExpertiseLinks',existing:existingLinks.total,planned:linkSpecs.length,created:linkCreated,mode:APPLY?'apply':'dry-run'});
}
async function main() {
  const auth = await post({action:'verifyAdminCredentials',username:ADMIN_USERNAME,password:ADMIN_PASSWORD});
  const report = [];
  for (const [sheet, planned] of Object.entries(records)) {
    const current = await post({action:'adminList',sheet,token:auth.token,limit:500});
    const titleKey = sheet === 'Expertise' ? 'Name' : 'Title';
    const existing = new Set((current.data || []).map(row=>normalize(row[titleKey])));
    let created = 0, skipped = 0;
    for (const raw of planned) {
      if (existing.has(normalize(raw[titleKey]))) { skipped += 1; continue; }
      if (!APPLY) { created += 1; continue; }
      const data = {...raw};
      if (sheet === 'Training' && data._file) {
        if (UPLOAD_IMAGES) {
          const upload = await uploadCertificate(auth.token,data._file);
          data.CertificateFileID = upload.fileId;
        }
        delete data._file;
      }
      await post({action:'create',sheet,token:auth.token,data});
      existing.add(normalize(data[titleKey]));
      created += 1;
    }
    report.push({sheet,existing:current.total,planned:planned.length,created,skipped,mode:APPLY?'apply':'dry-run'});
  }
  await seedRelationships(auth.token, report);
  console.log(JSON.stringify(report,null,2));
}

main().catch(error=>{ console.error(error.message); process.exit(1); });
