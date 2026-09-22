// C2 curriculum: lexical chunks, advanced grammar, long-form listening/reading,
// and three six-lesson courses. Lexical chunks are used deliberately because
// C2 learners need precise combinations and register, not isolated rare words.

type LexicalGroup = {
  category: string;
  entries: Array<[phrase: string, meaning: string]>;
};

const lexicalGroups: LexicalGroup[] = [
  { category: "Argument & Rhetoric", entries: [
    ["cogent argument", "lập luận chặt chẽ, thuyết phục"], ["specious reasoning", "lý lẽ có vẻ đúng nhưng thực ra sai"],
    ["tenuous claim", "nhận định thiếu cơ sở vững chắc"], ["fallacious assumption", "giả định dựa trên ngụy biện"],
    ["equivocal response", "phản hồi mập mờ, nước đôi"], ["unequivocal endorsement", "sự ủng hộ rõ ràng, dứt khoát"],
    ["logical corollary", "hệ quả logic tất yếu"], ["underlying premise", "tiền đề nền tảng"],
    ["axiomatic principle", "nguyên lý được mặc nhiên thừa nhận"], ["plausible inference", "suy luận hợp lý, có vẻ đúng"],
    ["contentious proposition", "đề xuất gây nhiều tranh cãi"], ["compelling counterpoint", "luận điểm đối trọng đầy sức nặng"],
    ["measured rebuttal", "lời bác bỏ có cân nhắc"], ["decisive refutation", "sự bác bỏ dứt khoát bằng lý lẽ"],
    ["witty rejoinder", "lời đáp trả sắc sảo"], ["qualified concession", "sự nhượng bộ kèm điều kiện"],
    ["crucial caveat", "điều lưu ý quan trọng"], ["rhetorical flourish", "cách diễn đạt hoa mỹ để tăng hiệu quả"],
    ["polemical tone", "giọng điệu tranh luận gay gắt"], ["intellectual sophistry", "lối ngụy biện tinh vi"],
  ]},
  { category: "Academic Reasoning", entries: [
    ["delineate the scope", "xác định rõ phạm vi"], ["elucidate a concept", "làm sáng tỏ một khái niệm"],
    ["expound a theory", "trình bày chi tiết một học thuyết"], ["substantiate a claim", "đưa bằng chứng củng cố nhận định"],
    ["corroborate the findings", "xác nhận thêm cho các phát hiện"], ["invalidate a conclusion", "làm mất giá trị của kết luận"],
    ["obfuscate the issue", "làm vấn đề trở nên khó hiểu"], ["misconstrue the evidence", "hiểu sai bằng chứng"],
    ["extrapolate from data", "ngoại suy từ dữ liệu"], ["contextualize the result", "đặt kết quả vào đúng bối cảnh"],
    ["juxtapose two accounts", "đặt hai cách thuật lại cạnh nhau để so sánh"], ["reconcile conflicting evidence", "dung hòa các bằng chứng mâu thuẫn"],
    ["ascertain the cause", "xác định chắc chắn nguyên nhân"], ["discern a pattern", "nhận ra một quy luật khó thấy"],
    ["postulate a mechanism", "đề xuất một cơ chế giả định"], ["formulate a hypothesis", "xây dựng một giả thuyết"],
    ["scrutinize the methodology", "xem xét kỹ phương pháp nghiên cứu"], ["synthesize multiple sources", "tổng hợp nhiều nguồn"],
    ["conceptualize the problem", "khái niệm hóa vấn đề"], ["problematize an assumption", "chỉ ra sự phức tạp trong một giả định"],
  ]},
  { category: "Diplomacy & Negotiation", entries: [
    ["conciliatory gesture", "cử chỉ mang tính hòa giải"], ["intransigent stance", "lập trường cứng rắn không nhượng bộ"],
    ["amenable to compromise", "sẵn lòng thỏa hiệp"], ["acquiesce to a request", "miễn cưỡng chấp thuận một yêu cầu"],
    ["appease public concern", "xoa dịu lo ngại của công chúng"], ["mediate a dispute", "làm trung gian hòa giải tranh chấp"],
    ["arbitrate between parties", "phân xử giữa các bên"], ["de-escalate tensions", "hạ nhiệt căng thẳng"],
    ["diplomatic rapprochement", "sự xích lại gần nhau về ngoại giao"], ["period of détente", "giai đoạn hòa hoãn"],
    ["negotiating impasse", "bế tắc trong đàm phán"], ["political stalemate", "thế giằng co chính trị"],
    ["reciprocal arrangement", "thỏa thuận có đi có lại"], ["unilateral action", "hành động đơn phương"],
    ["multilateral framework", "khuôn khổ đa phương"], ["forge a consensus", "tạo dựng sự đồng thuận"],
    ["broker a compromise", "đứng ra dàn xếp thỏa hiệp"], ["diplomatic brinkmanship", "chiến thuật ngoại giao bên bờ đối đầu"],
    ["special envoy", "đặc phái viên"], ["good-faith negotiation", "đàm phán với thiện chí"],
  ]},
  { category: "Law & Public Policy", entries: [
    ["established jurisprudence", "hệ thống án lệ, học thuyết pháp lý đã định hình"], ["statutory obligation", "nghĩa vụ theo luật định"],
    ["municipal ordinance", "sắc lệnh hoặc quy định cấp thành phố"], ["interim injunction", "lệnh cấm tạm thời của tòa"],
    ["protracted litigation", "quá trình kiện tụng kéo dài"], ["prospective litigant", "người có khả năng khởi kiện"],
    ["adjudicate a dispute", "xét xử và ra phán quyết về tranh chấp"], ["territorial jurisdiction", "thẩm quyền theo lãnh thổ"],
    ["binding precedent", "án lệ có tính ràng buộc"], ["contractual proviso", "điều khoản bảo lưu trong hợp đồng"],
    ["ratify an agreement", "phê chuẩn một thỏa thuận"], ["rescind a contract", "hủy bỏ hợp đồng"],
    ["enact legislation", "ban hành luật"], ["repeal a statute", "bãi bỏ một đạo luật"],
    ["regulatory compliance", "việc tuân thủ quy định"], ["copyright infringement", "hành vi xâm phạm bản quyền"],
    ["civil liability", "trách nhiệm dân sự"], ["exonerate the accused", "minh oan cho bị cáo"],
    ["culpable negligence", "sự bất cẩn đáng bị quy trách nhiệm"], ["seek restitution", "yêu cầu hoàn trả hoặc bồi hoàn"],
  ]},
  { category: "Economics & Finance", entries: [
    ["fiscal austerity", "chính sách thắt chặt tài khóa"], ["market liquidity", "tính thanh khoản của thị trường"],
    ["long-term solvency", "khả năng thanh toán dài hạn"], ["monetary tightening", "việc thắt chặt tiền tệ"],
    ["inflationary pressure", "áp lực gây lạm phát"], ["deflationary spiral", "vòng xoáy giảm phát"],
    ["exchange-rate volatility", "biến động tỷ giá"], ["economic stagnation", "tình trạng đình trệ kinh tế"],
    ["recessionary climate", "bối cảnh suy thoái"], ["agricultural subsidy", "trợ cấp nông nghiệp"],
    ["protective tariff", "thuế quan bảo hộ"], ["trade protectionism", "chủ nghĩa bảo hộ thương mại"],
    ["financial deregulation", "việc nới lỏng quy định tài chính"], ["natural monopoly", "độc quyền tự nhiên"],
    ["market oligopoly", "thị trường độc quyền nhóm"], ["negative externality", "ngoại tác tiêu cực"],
    ["price elasticity", "độ co giãn của giá"], ["executive remuneration", "thù lao của lãnh đạo"],
    ["budgetary appropriation", "khoản phân bổ ngân sách"], ["capital expenditure", "chi tiêu vốn"],
  ]},
  { category: "Science & Evidence", entries: [
    ["empirical observation", "quan sát dựa trên thực nghiệm"], ["falsifiable prediction", "dự đoán có thể kiểm chứng là sai"],
    ["experimental reproducibility", "khả năng tái lập kết quả thí nghiệm"], ["causal mechanism", "cơ chế nhân quả"],
    ["spurious correlation", "tương quan giả tạo"], ["confounding variable", "biến gây nhiễu"],
    ["statistical anomaly", "điểm bất thường thống kê"], ["paradigm shift", "sự chuyển đổi hệ hình"],
    ["methodological rigor", "tính nghiêm ngặt về phương pháp"], ["longitudinal study", "nghiên cứu theo thời gian dài"],
    ["cross-sectional analysis", "phân tích cắt ngang"], ["stochastic process", "quá trình ngẫu nhiên"],
    ["deterministic model", "mô hình tất định"], ["heuristic approach", "cách tiếp cận dựa trên quy tắc kinh nghiệm"],
    ["taxonomic classification", "phân loại theo hệ thống"], ["observable phenotype", "kiểu hình có thể quan sát"],
    ["genetic predisposition", "khuynh hướng do di truyền"], ["biological homeostasis", "trạng thái cân bằng nội môi"],
    ["thermodynamic entropy", "entropy trong nhiệt động lực học"], ["dynamic equilibrium", "trạng thái cân bằng động"],
  ]},
  { category: "Society & Politics", entries: [
    ["cultural hegemony", "quyền bá chủ về văn hóa"], ["political pluralism", "tính đa nguyên chính trị"],
    ["populist rhetoric", "lối diễn ngôn dân túy"], ["authoritarian rule", "sự cai trị độc đoán"],
    ["totalitarian regime", "chế độ toàn trị"], ["national sovereignty", "chủ quyền quốc gia"],
    ["democratic legitimacy", "tính chính danh dân chủ"], ["ideological polarization", "sự phân cực ý thức hệ"],
    ["disenfranchised voters", "cử tri bị tước quyền hoặc mất tiếng nói"], ["marginalized community", "cộng đồng bị gạt ra bên lề"],
    ["urban gentrification", "quá trình chỉnh trang làm thay đổi tầng lớp cư dân"], ["demographic transition", "sự chuyển đổi cơ cấu dân số"],
    ["global diaspora", "cộng đồng ly tán trên toàn cầu"], ["cultural assimilation", "sự đồng hóa văn hóa"],
    ["social integration", "sự hòa nhập xã hội"], ["intersectional analysis", "phân tích các dạng bất bình đẳng giao thoa"],
    ["socioeconomic disparity", "chênh lệch kinh tế xã hội"], ["egalitarian ideal", "lý tưởng bình đẳng"],
    ["meritocratic system", "hệ thống trọng dụng theo năng lực"], ["bureaucratic inertia", "sức ì của bộ máy quan liêu"],
  ]},
  { category: "Media & Discourse", entries: [
    ["media sensationalism", "xu hướng giật gân của truyền thông"], ["viral misinformation", "thông tin sai lệch lan truyền nhanh"],
    ["coordinated disinformation", "thông tin sai có chủ đích được phối hợp"], ["state propaganda", "tuyên truyền của nhà nước"],
    ["editorial interference", "sự can thiệp vào nội dung biên tập"], ["disseminate information", "phổ biến thông tin"],
    ["amplify a narrative", "khuếch đại một câu chuyện hoặc diễn ngôn"], ["distort the facts", "bóp méo sự thật"],
    ["misrepresent a position", "trình bày sai lệch một quan điểm"], ["fabricate a story", "bịa đặt một câu chuyện"],
    ["verify independently", "xác minh độc lập"], ["authenticate a source", "xác thực một nguồn tin"],
    ["proper attribution", "việc ghi nguồn đúng cách"], ["preserve anonymity", "giữ kín danh tính"],
    ["institutional censorship", "sự kiểm duyệt của tổ chức"], ["biting satire", "lối châm biếm sâu cay"],
    ["political parody", "tác phẩm nhại chính trị"], ["dominant narrative", "diễn ngôn hoặc câu chuyện chi phối"],
    ["strategic framing", "cách đóng khung vấn đề có chủ đích"], ["deceptive clickbait", "tiêu đề câu nhấp gây hiểu lầm"],
  ]},
  { category: "Psychology & Behaviour", entries: [
    ["cognitive flexibility", "khả năng điều chỉnh cách suy nghĩ"], ["metacognitive awareness", "nhận thức về chính quá trình tư duy"],
    ["critical introspection", "sự tự xem xét có tính phản biện"], ["behavioural inhibition", "sự ức chế hành vi"],
    ["compulsive behaviour", "hành vi mang tính cưỡng chế"], ["psychological resilience", "khả năng phục hồi tâm lý"],
    ["social conformity", "sự tuân theo chuẩn mực xã hội"], ["cognitive dissonance", "sự bất hòa nhận thức"],
    ["confirmation bias", "thiên kiến xác nhận"], ["innate temperament", "khí chất bẩm sinh"],
    ["secure attachment", "kiểu gắn bó an toàn"], ["perceived self-efficacy", "niềm tin vào năng lực bản thân"],
    ["delayed gratification", "khả năng trì hoãn thỏa mãn"], ["heightened impulsivity", "tính bốc đồng gia tăng"],
    ["persistent rumination", "sự suy nghĩ luẩn quẩn kéo dài"], ["emotional desensitization", "sự chai lì cảm xúc"],
    ["empathetic response", "phản ứng đồng cảm"], ["reciprocal altruism", "lòng vị tha có tính qua lại"],
    ["profound ambivalence", "trạng thái mâu thuẫn cảm xúc sâu sắc"], ["subconscious association", "mối liên hệ trong tiềm thức"],
  ]},
  { category: "Literature & Culture", entries: [
    ["extended allegory", "phép ngụ ngôn kéo dài xuyên tác phẩm"], ["subtle allusion", "lời ám chỉ tinh tế"],
    ["recurring motif", "mô-típ lặp lại"], ["layered symbolism", "hệ thống biểu tượng nhiều tầng"],
    ["dramatic irony", "nghịch lý kịch khi khán giả biết hơn nhân vật"], ["central paradox", "nghịch lý trung tâm"],
    ["stylistic pastiche", "tác phẩm mô phỏng pha trộn phong cách"], ["literary intertextuality", "tính liên văn bản"],
    ["mythic archetype", "nguyên mẫu mang tính thần thoại"], ["morally ambiguous protagonist", "nhân vật chính mơ hồ về đạo đức"],
    ["formidable antagonist", "nhân vật đối kháng đáng gờm"], ["unexpected denouement", "phần kết bất ngờ tháo gỡ nút thắt"],
    ["omniscient narrator", "người kể chuyện toàn tri"], ["unreliable narrator", "người kể chuyện không đáng tin"],
    ["subtle foreshadowing", "sự báo trước tinh tế"], ["evocative imagery", "hình ảnh gợi cảm xúc mạnh"],
    ["rhythmic cadence", "nhịp điệu của câu chữ"], ["elevated diction", "cách dùng từ trang trọng, cao cấp"],
    ["regional vernacular", "phương ngữ địa phương"], ["canonical oeuvre", "toàn bộ tác phẩm kinh điển của một tác giả"],
  ]},
  { category: "Environment & Climate", entries: [
    ["anthropogenic warming", "sự nóng lên do con người gây ra"], ["biodiversity loss", "sự suy giảm đa dạng sinh học"],
    ["industrial decarbonization", "quá trình khử carbon trong công nghiệp"], ["carbon sequestration", "việc cô lập và lưu trữ carbon"],
    ["climate mitigation", "biện pháp giảm nhẹ biến đổi khí hậu"], ["adaptive capacity", "khả năng thích ứng"],
    ["environmental degradation", "sự suy thoái môi trường"], ["resource depletion", "sự cạn kiệt tài nguyên"],
    ["groundwater contamination", "ô nhiễm nước ngầm"], ["ecological remediation", "việc phục hồi môi trường sinh thái"],
    ["nutrient eutrophication", "hiện tượng phú dưỡng do dư thừa dinh dưỡng"], ["progressive desertification", "quá trình sa mạc hóa dần dần"],
    ["ocean acidification", "sự axit hóa đại dương"], ["large-scale reforestation", "tái trồng rừng quy mô lớn"],
    ["targeted afforestation", "trồng rừng mới có mục tiêu"], ["trophic biomagnification", "sự khuếch đại chất độc qua chuỗi thức ăn"],
    ["microplastic pollution", "ô nhiễm vi nhựa"], ["circular resource use", "sử dụng tài nguyên theo mô hình tuần hoàn"],
    ["renewable intermittency", "tính gián đoạn của năng lượng tái tạo"], ["watershed stewardship", "quản lý có trách nhiệm đối với lưu vực"],
  ]},
  { category: "Technology & Systems", entries: [
    ["algorithmic accountability", "trách nhiệm giải trình của thuật toán"], ["system interoperability", "khả năng liên thông giữa các hệ thống"],
    ["horizontal scalability", "khả năng mở rộng theo chiều ngang"], ["network latency", "độ trễ mạng"],
    ["transaction throughput", "thông lượng giao dịch"], ["fault-tolerant redundancy", "dự phòng có khả năng chịu lỗi"],
    ["end-to-end encryption", "mã hóa đầu cuối"], ["asymmetric decryption", "giải mã bất đối xứng"],
    ["multi-factor authentication", "xác thực đa yếu tố"], ["role-based authorization", "phân quyền dựa trên vai trò"],
    ["planned obsolescence", "sự lỗi thời được lên kế hoạch"], ["ubiquitous computing", "điện toán hiện diện khắp nơi"],
    ["autonomous decision-making", "việc ra quyết định tự động"], ["data provenance", "nguồn gốc và lịch sử của dữ liệu"],
    ["supply-chain traceability", "khả năng truy xuất chuỗi cung ứng"], ["secure sandboxing", "cơ chế cô lập an toàn"],
    ["hardware virtualization", "ảo hóa phần cứng"], ["application containerization", "đóng gói ứng dụng bằng container"],
    ["service orchestration", "điều phối các dịch vụ"], ["decentralized architecture", "kiến trúc phi tập trung"],
  ]},
  { category: "Leadership & Governance", entries: [
    ["fiduciary duty", "nghĩa vụ ủy thác vì lợi ích của bên khác"], ["institutional accountability", "trách nhiệm giải trình của tổ chức"],
    ["effective governance", "cơ chế quản trị hiệu quả"], ["stakeholder alignment", "sự đồng thuận giữa các bên liên quan"],
    ["contingency planning", "lập kế hoạch dự phòng"], ["transparent procurement", "quy trình mua sắm minh bạch"],
    ["rigorous due diligence", "quá trình thẩm định kỹ lưỡng"], ["operational feasibility", "tính khả thi trong vận hành"],
    ["strategic mandate", "nhiệm vụ chiến lược được giao"], ["organizational remit", "phạm vi trách nhiệm của tổ chức"],
    ["independent oversight", "cơ chế giám sát độc lập"], ["critical bottleneck", "điểm nghẽn nghiêm trọng"],
    ["workforce attrition", "sự hao hụt nhân sự"], ["talent retention", "việc giữ chân nhân tài"],
    ["succession planning", "lập kế hoạch kế nhiệm"], ["organizational restructuring", "tái cơ cấu tổ chức"],
    ["cross-functional alignment", "sự phối hợp đồng thuận giữa các bộ phận"], ["skilled facilitation", "khả năng điều phối chuyên nghiệp"],
    ["formal escalation", "việc chuyển vấn đề lên cấp cao hơn theo quy trình"], ["distributed leadership", "mô hình lãnh đạo phân tán"],
  ]},
  { category: "Character & Emotion", entries: [
    ["magnanimous response", "phản ứng cao thượng, rộng lượng"], ["taciturn demeanor", "phong thái ít nói"],
    ["gregarious personality", "tính cách hòa đồng, thích giao du"], ["fastidious attention", "sự chú ý cực kỳ kỹ tính"],
    ["meticulous preparation", "sự chuẩn bị tỉ mỉ"], ["scrupulous honesty", "sự trung thực tuyệt đối, có nguyên tắc"],
    ["unscrupulous conduct", "hành vi bất chấp đạo đức"], ["obstinate refusal", "sự từ chối ngoan cố"],
    ["pragmatic outlook", "cách nhìn thực tế"], ["idealistic conviction", "niềm tin mang tính lý tưởng"],
    ["deeply cynical view", "quan điểm hoài nghi tiêu cực sâu sắc"], ["sanguine temperament", "tính khí lạc quan"],
    ["growing apprehension", "nỗi lo ngại ngày càng tăng"], ["righteous indignation", "sự phẫn nộ vì bất công"],
    ["genuine remorse", "sự hối hận chân thành"], ["dangerous complacency", "sự tự mãn nguy hiểm"],
    ["studied nonchalance", "vẻ thản nhiên có chủ ý"], ["vehement opposition", "sự phản đối mãnh liệt"],
    ["reticent witness", "nhân chứng dè dặt, ngại nói"], ["forthright admission", "lời thừa nhận thẳng thắn"],
  ]},
  { category: "Change & Intervention", entries: [
    ["ameliorate the conditions", "cải thiện các điều kiện khó khăn"], ["exacerbate inequality", "làm trầm trọng thêm bất bình đẳng"],
    ["circumvent a restriction", "lách qua một hạn chế"], ["consolidate recent gains", "củng cố những thành quả gần đây"],
    ["curtail excessive spending", "cắt giảm chi tiêu quá mức"], ["engender public trust", "tạo ra lòng tin của công chúng"],
    ["galvanize a movement", "thúc đẩy mạnh mẽ một phong trào"], ["impede meaningful reform", "cản trở cải cách có ý nghĩa"],
    ["perpetuate a stereotype", "duy trì một khuôn mẫu định kiến"], ["precipitate a crisis", "khiến khủng hoảng xảy ra đột ngột"],
    ["preclude further action", "ngăn không cho hành động tiếp theo xảy ra"], ["rectify an omission", "khắc phục một thiếu sót"],
    ["relinquish control", "từ bỏ quyền kiểm soát"], ["repudiate an allegation", "bác bỏ một cáo buộc"],
    ["bolster confidence", "củng cố niềm tin"], ["undermine credibility", "làm suy giảm uy tín"],
    ["transcend conventional boundaries", "vượt qua các ranh giới thông thường"], ["vindicate a decision", "chứng minh một quyết định là đúng"],
    ["wield considerable influence", "nắm và sử dụng ảnh hưởng đáng kể"], ["forestall a downturn", "ngăn chặn trước một đợt suy giảm"],
  ]},
];

const rawLexicon = lexicalGroups.flatMap(group => group.entries.map(entry => ({ category: group.category, entry })));

export const c2Vocabulary = rawLexicon.map(({ category, entry: [word, meaning] }, index) => ({
  id: `c2v${String(index + 1).padStart(3, "0")}`,
  word,
  ipa: "",
  meaning,
  definition: `A precise C2-level expression used in ${category.toLowerCase()} contexts.`,
  partOfSpeech: "lexical chunk",
  example: `The speaker used “${word}” to express the idea with greater precision.`,
  translation: `Người nói dùng cụm “${word}” (${meaning}) để diễn đạt ý chính xác hơn.`,
  category,
  level: "C2",
  synonyms: [],
  antonyms: [],
  collocations: [word],
  wordFamily: [],
}));

export const c2Grammar = [
  { id: "g61", title: "Đảo ngữ tu từ ở cấp độ C2", level: "C2", description: "Dùng đảo ngữ để điều chỉnh tiêu điểm và tạo nhịp điệu trong lập luận trang trọng.", structure: ["Rarely/Seldom + auxiliary + subject + verb", "So + adjective + be + subject + that...", "Not only + auxiliary + subject + verb, but..."], examples: ["Rarely has a policy generated such sustained debate.", "So profound was the change that no sector remained unaffected."], notes: "Đảo ngữ phải phục vụ trọng tâm thông tin; không dùng chỉ để làm câu có vẻ phức tạp.", commonMistake: "Sau trạng từ phủ định cần đảo trợ động từ và chủ ngữ." },
  { id: "g62", title: "Mệnh đề nhượng bộ tinh tế", level: "C2", description: "Thừa nhận giới hạn mà không làm suy yếu lập luận chính.", structure: ["Adjective though + subject + verb", "Much as + subject + verb", "While it is true that..., it does not follow that..."], examples: ["Compelling though the evidence is, it remains incomplete.", "Much as I sympathize, the proposal is unworkable."], notes: "Nhượng bộ tốt cho thấy người viết hiểu quan điểm đối lập trước khi phản biện.", commonMistake: "Không dùng but sau although/though trong cùng cấu trúc." },
  { id: "g63", title: "Điều kiện hàm ẩn và phản thực", level: "C2", description: "Diễn đạt điều kiện không dùng if trong văn phong cô đọng.", structure: ["Without/But for + noun, clause", "Otherwise + clause", "Given + noun, clause"], examples: ["But for the final amendment, the bill would have failed.", "The evidence must be disclosed; otherwise, the ruling may be challenged."], notes: "Xác định rõ thời gian thực của điều kiện để chọn modal hoàn thành phù hợp.", commonMistake: "Không trộn kết quả hiện tại và quá khứ nếu nghĩa không yêu cầu." },
  { id: "g64", title: "Hedging và boosting có kiểm soát", level: "C2", description: "Điều chỉnh độ chắc chắn theo chất lượng bằng chứng.", structure: ["may arguably / appears to / is likely to", "clearly / demonstrably / undoubtedly", "The evidence warrants the conclusion that..."], examples: ["The intervention may arguably have reduced short-term risk.", "The data demonstrably contradict the original estimate."], notes: "Mức độ khẳng định phải tương xứng với bằng chứng, không chỉ với niềm tin người viết.", commonMistake: "Tránh xếp chồng nhiều hedge trong một mệnh đề." },
  { id: "g65", title: "Danh hóa và giải danh hóa", level: "C2", description: "Chuyển linh hoạt giữa văn phong cô đọng và câu có tác nhân rõ ràng.", structure: ["verb/adjective → abstract noun", "abstract noun → subject + active verb", "The + noun + of..."], examples: ["The committee rejected the plan. → The committee's rejection of the plan...", "Implementation failed. → The agency failed to implement the policy."], notes: "Giải danh hóa khi cần làm rõ ai làm gì; danh hóa khi cần liên kết khái niệm.", commonMistake: "Không để chuỗi danh từ dài che mất quan hệ giữa các ý." },
  { id: "g66", title: "Cấu trúc thông tin và tiêu điểm", level: "C2", description: "Sắp xếp thông tin cũ–mới để đoạn văn liền mạch.", structure: ["Given information → new information", "What-clause + be + focus", "The reason why... is that..."], examples: ["What the figures conceal is the uneven distribution of gains.", "The reason why the trial matters is that it tests the core assumption."], notes: "Đặt thông tin quen thuộc đầu câu giúp người đọc theo mạch lập luận.", commonMistake: "Tránh nhiều câu liên tiếp cùng mở bằng cấu trúc chẻ." },
  { id: "g67", title: "Tham chiếu diễn ngôn mở rộng", level: "C2", description: "Dùng danh từ tóm tắt để nối cả mệnh đề hoặc đoạn văn.", structure: ["This + summary noun", "Such + noun", "The former/the latter"], examples: ["The sample excluded rural households. This omission limits the conclusion.", "The policy reduced costs but increased delays; such a trade-off requires scrutiny."], notes: "Danh từ tóm tắt phải gọi đúng bản chất ý trước đó.", commonMistake: "Không dùng this đứng riêng khi có nhiều tiền tố tham chiếu khả dĩ." },
  { id: "g68", title: "Cấu trúc song song và đối xứng", level: "C2", description: "Tạo lập luận cân đối bằng các thành phần cùng dạng ngữ pháp.", structure: ["not X but Y", "to verb, to verb, and to verb", "the more..., the more..."], examples: ["The aim is not to silence dissent but to clarify its source.", "The more transparent the process, the easier it is to defend."], notes: "Song song giúp câu dài dễ xử lý và làm nổi bật quan hệ logic.", commonMistake: "Không phối hợp danh từ với mệnh đề hoặc V-ing với to-infinitive thiếu chủ ý." },
  { id: "g69", title: "Động từ tường thuật theo lập trường", level: "C2", description: "Chọn reporting verb để thể hiện mức đồng tình và sức mạnh của nguồn.", structure: ["author + concedes/contends/refutes + that", "evidence + suggests/demonstrates + that", "claim + is premised on..."], examples: ["The author concedes that the sample is narrow.", "The report contends that regulation is insufficient."], notes: "Động từ tường thuật không trung tính như nhau; lựa chọn của người viết thể hiện đánh giá.", commonMistake: "Không dùng proves khi dữ liệu chỉ suggests." },
  { id: "g70", title: "Modal quá khứ và sắc thái phản thực", level: "C2", description: "Phân biệt suy đoán, phê bình và cơ hội đã mất trong quá khứ.", structure: ["needn't have + V3", "might/could conceivably have + V3", "was/were to have + V3"], examples: ["The team needn't have delayed the launch.", "The measure could conceivably have prevented the loss."], notes: "Needn't have cho biết hành động đã xảy ra nhưng không cần thiết.", commonMistake: "Phân biệt didn't need to do với needn't have done." },
  { id: "g71", title: "Ngôn ngữ ngoại giao và giảm nhẹ", level: "C2", description: "Giảm độ trực diện trong bất đồng, yêu cầu và từ chối chuyên nghiệp.", structure: ["I wonder whether...", "We would be reluctant to...", "That may be so; nevertheless,..."], examples: ["I wonder whether the timetable allows sufficient consultation.", "We would be reluctant to endorse the proposal in its present form."], notes: "Giảm nhẹ vẫn cần thông điệp rõ; lịch sự không đồng nghĩa với mơ hồ.", commonMistake: "Tránh dùng quá nhiều lớp giảm nhẹ khiến người nghe không hiểu yêu cầu." },
  { id: "g72", title: "Nhịp câu và dấu câu nâng cao", level: "C2", description: "Dùng dấu chấm phẩy, hai chấm và gạch ngang để biểu đạt quan hệ ý nghĩa.", structure: ["independent clause; conjunctive adverb, clause", "claim: elaboration", "statement—qualification—continuation"], examples: ["The evidence is incomplete; nevertheless, action may be justified.", "One issue remains: who bears the cost?"], notes: "Dấu câu làm rõ cấu trúc lập luận, không thay thế từ nối khi quan hệ chưa rõ.", commonMistake: "Không nối hai mệnh đề độc lập chỉ bằng dấu phẩy." },
];

export const c2Listening = [
  { id: "l16", title: "When evidence changes a position", level: "C2", topic: "Argument", duration: 5, transcript: `Host: Critics say you reversed your position. Is that a fair description?\nAnalyst: It is accurate in the narrow sense that my conclusion changed, but misleading if it implies inconsistency. The first estimate rested on a limited sample. Once the full dataset became available, two assumptions no longer held.\nHost: Some listeners may hear that as an excuse.\nAnalyst: Only if changing one's mind is treated as a defect. Intellectual consistency means applying the same standard to new evidence, not preserving the same answer regardless of what the evidence shows.`, translation: `Người dẫn: Những người chỉ trích nói rằng ông đã đảo ngược quan điểm. Mô tả đó có công bằng không?\nNhà phân tích: Nó đúng theo nghĩa hẹp rằng kết luận của tôi đã thay đổi, nhưng gây hiểu lầm nếu ám chỉ sự thiếu nhất quán. Ước tính đầu dựa trên mẫu hạn chế. Khi có toàn bộ dữ liệu, hai giả định không còn đúng.\nNgười dẫn: Một số người nghe có thể coi đó là lời bào chữa.\nNhà phân tích: Chỉ khi việc đổi ý bị coi là khuyết điểm. Nhất quán trí tuệ là áp dụng cùng tiêu chuẩn cho bằng chứng mới, chứ không phải giữ nguyên câu trả lời bất kể bằng chứng cho thấy gì.` },
  { id: "l17", title: "Negotiating without false consensus", level: "C2", topic: "Diplomacy", duration: 5, transcript: `Mediator: We appear to agree on the objective but not on the distribution of risk. I suggest we stop drafting a joint statement as though that difference had disappeared.\nDelegate: Would acknowledging disagreement not weaken confidence?\nMediator: Concealing it would be worse. We can state the shared objective, identify the unresolved allocation issue, and establish a review mechanism. That is a limited agreement, but it is one each side can honor.`, translation: `Hòa giải viên: Có vẻ chúng ta đồng ý về mục tiêu nhưng chưa đồng ý về cách phân bổ rủi ro. Tôi đề nghị ngừng soạn tuyên bố chung như thể khác biệt đó đã biến mất.\nĐại biểu: Thừa nhận bất đồng có làm suy giảm niềm tin không?\nHòa giải viên: Che giấu còn tệ hơn. Ta có thể nêu mục tiêu chung, xác định vấn đề phân bổ chưa giải quyết và lập cơ chế rà soát. Đó là thỏa thuận có giới hạn nhưng là điều mỗi bên có thể tôn trọng.` },
  { id: "l18", title: "Reading an economic headline carefully", level: "C2", topic: "Economics", duration: 5, transcript: `Economist: The headline says household incomes rose, which is true in nominal terms. Yet prices rose faster, and the gains were concentrated among higher earners.\nJournalist: So the headline is false?\nEconomist: Not exactly. It selects one accurate measure and allows readers to infer a broader improvement that the measure cannot establish. The remedy is not to discard the figure, but to place it beside inflation-adjusted income and distributional data.`, translation: `Nhà kinh tế: Tiêu đề nói thu nhập hộ gia đình tăng, điều này đúng theo giá trị danh nghĩa. Nhưng giá tăng nhanh hơn và lợi ích tập trung ở nhóm thu nhập cao.\nNhà báo: Vậy tiêu đề sai sao?\nNhà kinh tế: Không hẳn. Nó chọn một thước đo chính xác nhưng khiến độc giả suy ra sự cải thiện rộng hơn mà thước đo đó không chứng minh được. Cách xử lý không phải bỏ số liệu mà đặt nó cạnh thu nhập đã điều chỉnh theo lạm phát và dữ liệu phân phối.` },
  { id: "l19", title: "Accountability in automated decisions", level: "C2", topic: "Technology", duration: 5, transcript: `Chair: The vendor assures us that the model is highly accurate.\nAuditor: Aggregate accuracy is relevant, but it does not answer who is harmed by the errors or whether an affected person can challenge a decision.\nChair: Are you recommending that we abandon automation?\nAuditor: No. I am recommending traceable inputs, documented thresholds, human review for consequential cases, and a route of appeal. Efficiency does not dissolve institutional responsibility.`, translation: `Chủ tọa: Nhà cung cấp đảm bảo mô hình có độ chính xác rất cao.\nKiểm toán viên: Độ chính xác tổng thể có liên quan nhưng không trả lời ai bị thiệt hại bởi lỗi hoặc người bị ảnh hưởng có thể khiếu nại quyết định không.\nChủ tọa: Ông đề nghị từ bỏ tự động hóa sao?\nKiểm toán viên: Không. Tôi đề nghị đầu vào có thể truy vết, ngưỡng được ghi chép, con người rà soát trường hợp hệ trọng và có đường khiếu nại. Hiệu quả không xóa bỏ trách nhiệm của tổ chức.` },
  { id: "l20", title: "What adaptation can and cannot do", level: "C2", topic: "Climate", duration: 5, transcript: `Planner: Adaptation is sometimes presented as an alternative to cutting emissions. That is a category error. Better drainage can reduce damage from heavier rainfall; it cannot prevent rainfall extremes from intensifying indefinitely.\nResident: But mitigation benefits may take decades.\nPlanner: Precisely why both are required. Adaptation manages risks already present, while mitigation limits the scale of future risks. Treating either as sufficient leaves communities exposed.`, translation: `Nhà quy hoạch: Thích ứng đôi khi được trình bày như phương án thay thế cho cắt giảm phát thải. Đó là nhầm lẫn về phạm trù. Thoát nước tốt hơn có thể giảm thiệt hại do mưa lớn; nó không thể ngăn mưa cực đoan tăng mãi.\nNgười dân: Nhưng lợi ích giảm phát thải có thể mất hàng thập kỷ.\nNhà quy hoạch: Chính vì thế cần cả hai. Thích ứng quản lý rủi ro đã hiện hữu, còn giảm nhẹ giới hạn quy mô rủi ro tương lai. Coi một trong hai là đủ sẽ khiến cộng đồng dễ tổn thương.` },
  { id: "l21", title: "Interpreting an unreliable narrator", level: "C2", topic: "Literature", duration: 5, transcript: `Lecturer: An unreliable narrator does not simply lie. The discrepancy may arise from limited knowledge, self-deception, or values the reader no longer shares.\nStudent: How can we decide which interpretation is intended?\nLecturer: We compare the narrator's account with patterns the text establishes elsewhere: contradictions, other characters' reactions, and details the narrator reports without grasping their significance. Reliability is inferred, not announced.`, translation: `Giảng viên: Người kể chuyện không đáng tin không đơn giản chỉ nói dối. Độ lệch có thể đến từ hiểu biết hạn chế, tự lừa dối hoặc hệ giá trị độc giả không còn chia sẻ.\nSinh viên: Làm sao quyết định cách hiểu nào được chủ ý?\nGiảng viên: Ta so lời kể với các mẫu văn bản thiết lập ở nơi khác: mâu thuẫn, phản ứng nhân vật khác và chi tiết người kể thuật lại mà không hiểu ý nghĩa. Độ đáng tin được suy ra chứ không được tuyên bố.` },
];

export const c2Reading = [
  { id: "r16", title: "The discipline of changing one's mind", level: "C2", category: "Critical Thinking", minutes: 7, body: `Public debate often rewards the appearance of certainty. A person who repeats the same position is described as principled, while someone who revises a judgment risks being called inconsistent. Yet consistency has at least two meanings. One is loyalty to a conclusion; the other is loyalty to the standards by which conclusions are reached. When relevant evidence changes, these two forms of consistency may point in opposite directions.\n\nA responsible revision does not pretend the earlier judgment never existed. It identifies which premise failed, what new information matters, and how much the conclusion should change. Nor does every new fact justify reversal. Evidence must be weighed for quality, relevance, and scale. The intellectual task is therefore neither stubbornness nor endless flexibility. It is calibrated responsiveness: enough stability to resist noise, and enough openness to recognize when the old account no longer explains the world.`, translation: `Tranh luận công khai thường tưởng thưởng vẻ chắc chắn. Người lặp lại cùng quan điểm được coi là có nguyên tắc, còn người điều chỉnh phán đoán dễ bị gọi là thiếu nhất quán. Nhưng nhất quán có ít nhất hai nghĩa: trung thành với kết luận hoặc trung thành với tiêu chuẩn tạo ra kết luận. Khi bằng chứng liên quan thay đổi, hai dạng nhất quán có thể đi ngược nhau.\n\nMột sự điều chỉnh có trách nhiệm không giả vờ phán đoán cũ chưa từng tồn tại. Nó chỉ ra tiền đề nào sai, thông tin mới nào quan trọng và kết luận nên đổi đến đâu. Không phải mọi dữ kiện mới đều biện minh cho đảo chiều; bằng chứng phải được cân theo chất lượng, mức liên quan và quy mô. Nhiệm vụ trí tuệ vì thế không phải ngoan cố hay linh hoạt vô tận, mà là phản ứng có hiệu chỉnh: đủ ổn định để chống nhiễu và đủ cởi mở để nhận ra khi cách giải thích cũ không còn phù hợp.` },
  { id: "r17", title: "Agreement without unanimity", level: "C2", category: "Diplomacy", minutes: 7, body: `Institutions frequently mistake consensus for unanimity. The distinction matters. Unanimity requires every participant to endorse the same decision; consensus can mean that participants understand the decision, have had their objections heard, and are willing to let it proceed despite reservations.\n\nFalse unanimity is fragile because suppressed disagreement returns during implementation. Durable agreement records unresolved concerns, specifies review points, and makes clear what evidence would justify a change. This approach may look less impressive than a triumphant declaration that everyone agrees. It is usually more honest and more useful. The purpose of negotiation is not to manufacture identical beliefs, but to create terms under which people with different beliefs can act together without misrepresenting their positions.`, translation: `Các tổ chức thường nhầm đồng thuận với nhất trí tuyệt đối. Nhất trí đòi hỏi mọi người ủng hộ cùng quyết định; đồng thuận có thể chỉ là mọi người hiểu quyết định, được lắng nghe phản đối và sẵn lòng để quyết định tiếp tục dù còn dè dặt.\n\nSự nhất trí giả tạo mong manh vì bất đồng bị nén sẽ quay lại khi thực thi. Thỏa thuận bền vững ghi nhận lo ngại chưa giải quyết, đặt mốc rà soát và nêu rõ bằng chứng nào sẽ khiến quyết định thay đổi. Cách này có thể kém ấn tượng hơn tuyên bố chiến thắng rằng tất cả đều đồng ý, nhưng thường trung thực và hữu ích hơn. Mục tiêu đàm phán không phải tạo ra niềm tin giống hệt nhau, mà tạo điều kiện để người có niềm tin khác nhau cùng hành động mà không xuyên tạc lập trường.` },
  { id: "r18", title: "The number behind the headline", level: "C2", category: "Economics", minutes: 7, body: `A statistic may be accurate and still create a false impression. Average income can rise while most households see little improvement if gains are concentrated at the top. Employment can increase while total hours worked decline. A price index can slow even though prices remain far above their earlier level.\n\nNone of these observations makes the original measure useless. Each reveals that measures answer specific questions. Careful interpretation asks about the denominator, the time period, the distribution, and the comparison point. It also distinguishes a change in the rate from a change in the level. Statistical literacy therefore involves more than checking arithmetic. It requires understanding what a number is capable of establishing and resisting the temptation to make it carry a broader claim.`, translation: `Một thống kê có thể chính xác mà vẫn tạo ấn tượng sai. Thu nhập trung bình có thể tăng trong khi đa số hộ gia đình ít cải thiện nếu lợi ích tập trung ở nhóm trên. Việc làm có thể tăng trong khi tổng giờ làm giảm. Chỉ số giá có thể tăng chậm lại dù giá vẫn cao hơn nhiều so với trước.\n\nĐiều đó không làm thước đo ban đầu vô dụng, mà cho thấy mỗi thước đo trả lời câu hỏi cụ thể. Diễn giải cẩn thận hỏi về mẫu số, thời gian, phân phối và mốc so sánh; đồng thời phân biệt thay đổi tốc độ với thay đổi mức. Hiểu thống kê không chỉ là kiểm tra phép tính, mà còn hiểu con số có thể chứng minh điều gì và chống lại cám dỗ bắt nó gánh một nhận định rộng hơn.` },
  { id: "r19", title: "Automation and the location of responsibility", level: "C2", category: "Technology", minutes: 7, body: `When an automated system recommends a consequential decision, responsibility can become strangely diffuse. Designers point to the institution that deployed the model; managers point to technical experts; frontline staff point to the score displayed on their screen. The result is a decision made by an organization that no individual appears able to explain.\n\nMeaningful accountability requires more than naming a person to blame after failure. Inputs need provenance, thresholds need justification, and affected people need a practical route to challenge errors. Human review must also be substantive. A reviewer who lacks time, authority, or relevant information merely gives automation a ceremonial signature. The question is not whether humans or machines make decisions in isolation. It is whether the combined system preserves reasons, contestability, and the capacity to correct harm.`, translation: `Khi hệ thống tự động đề xuất quyết định hệ trọng, trách nhiệm có thể trở nên phân tán kỳ lạ. Nhà thiết kế chỉ sang tổ chức triển khai; quản lý chỉ sang chuyên gia kỹ thuật; nhân viên tuyến đầu chỉ vào điểm số trên màn hình. Kết quả là quyết định do tổ chức đưa ra nhưng dường như không cá nhân nào giải thích được.\n\nTrách nhiệm giải trình có ý nghĩa cần nhiều hơn việc tìm người để trách sau thất bại. Đầu vào cần nguồn gốc, ngưỡng cần lý do và người bị ảnh hưởng cần con đường thực tế để khiếu nại lỗi. Rà soát con người phải thực chất; người rà soát thiếu thời gian, quyền hạn hoặc thông tin chỉ trao cho tự động hóa một chữ ký nghi thức. Câu hỏi không phải người hay máy quyết định riêng lẻ, mà hệ thống kết hợp có giữ được lý do, khả năng phản biện và sửa chữa thiệt hại hay không.` },
  { id: "r20", title: "Adaptation has limits", level: "C2", category: "Environment", minutes: 7, body: `Climate adaptation is indispensable because some degree of change is already unavoidable. Cities can redesign drainage, farmers can diversify crops, and health systems can prepare for longer heat waves. These measures reduce harm, but their success can create a misleading sense that every risk is manageable.\n\nAdaptation has physical, financial, and social limits. A barrier designed for one sea level may fail at another. Insurance becomes unavailable when losses are too frequent. Communities may preserve buildings while losing cultural practices tied to a place. Mitigation and adaptation therefore address different parts of the same problem. The former limits how severe future change becomes; the latter reduces exposure to change already occurring. A credible strategy needs both and must be candid about the risks that neither can eliminate completely.`, translation: `Thích ứng khí hậu là thiết yếu vì một mức thay đổi đã không thể tránh. Thành phố có thể thiết kế lại thoát nước, nông dân đa dạng cây trồng và y tế chuẩn bị cho nắng nóng dài hơn. Các biện pháp giảm thiệt hại nhưng thành công có thể tạo ảo giác rằng mọi rủi ro đều quản lý được.\n\nThích ứng có giới hạn vật lý, tài chính và xã hội. Đê chắn thiết kế cho mực biển này có thể thất bại ở mực khác. Bảo hiểm biến mất khi tổn thất quá thường xuyên. Cộng đồng có thể giữ tòa nhà nhưng mất tập quán gắn với nơi chốn. Giảm nhẹ và thích ứng xử lý các phần khác nhau của cùng vấn đề: một bên giới hạn mức nghiêm trọng tương lai, bên kia giảm phơi nhiễm với thay đổi đang xảy ra. Chiến lược đáng tin cần cả hai và phải thẳng thắn về rủi ro không bên nào xóa hết.` },
  { id: "r21", title: "Why narrators fail us", level: "C2", category: "Literature", minutes: 7, body: `Readers sometimes treat an unreliable narrator as a puzzle with a single solution: identify the lie and reconstruct the truth. Many works demand a more complicated response. A narrator may report events accurately while misunderstanding their significance, or may perceive others clearly while remaining blind to personal motives. Reliability can vary by subject and moment.\n\nThis instability shifts attention from what happened to how knowledge is formed. Contradictions matter, but so do omissions, changes in tone, and reactions the narrator cannot explain. The reader becomes an active interpreter, comparing the stated account with patterns that exceed it. Unreliability is therefore not merely a device for surprise. It can dramatize the limits of memory, the protections of self-deception, and the uncomfortable fact that sincerity does not guarantee self-knowledge.`, translation: `Độc giả đôi khi coi người kể không đáng tin như câu đố có một lời giải: tìm lời nói dối và dựng lại sự thật. Nhiều tác phẩm đòi hỏi phản ứng phức tạp hơn. Người kể có thể thuật đúng sự kiện nhưng hiểu sai ý nghĩa, hoặc nhìn rõ người khác mà mù mờ về động cơ của mình. Độ đáng tin có thể thay đổi theo chủ đề và thời điểm.\n\nSự bất ổn này chuyển chú ý từ điều đã xảy ra sang cách tri thức hình thành. Mâu thuẫn quan trọng, nhưng cả điều bị bỏ sót, đổi giọng và phản ứng người kể không giải thích được cũng vậy. Độc giả trở thành người diễn giải chủ động, so lời kể với các mẫu vượt ra ngoài nó. Tính không đáng tin không chỉ để tạo bất ngờ; nó có thể diễn tả giới hạn ký ức, cơ chế tự lừa dối và sự thật khó chịu rằng chân thành không bảo đảm tự hiểu mình.` },
];

export const c2Questions = c2Vocabulary.slice(0, 72).map((item, index, items) => {
  const meanings = [item.meaning, items[(index + 11) % items.length].meaning, items[(index + 29) % items.length].meaning, items[(index + 47) % items.length].meaning];
  const correctAnswer = index % 4;
  const options = [...meanings.slice(1)];
  options.splice(correctAnswer, 0, meanings[0]);
  return {
    id: `c2q${String(index + 1).padStart(3, "0")}`,
    skill: "vocabulary",
    level: "C2",
    prompt: `Cụm “${item.word}” diễn đạt ý nào chính xác nhất?`,
    options,
    correctAnswer,
    explanation: `“${item.word}” có nghĩa là “${item.meaning}”. Đây là một cụm từ C2 thuộc chủ đề ${item.category}.`,
  };
});

const courseSpecs = [
  { id: "critical-argument-c2", title: "Critical Argument & Rhetoric C2", category: "Tư duy phản biện", description: "Phân tích tiền đề, nhận diện ngụy biện và xây dựng lập luận có độ chính xác học thuật cao.", duration: "8 tuần", instructor: "EnglishMaster Critical Thinking Lab", color: "purple", icon: "sparkles", outcomes: ["Đánh giá sức mạnh của lập luận", "Phản biện công bằng và chính xác", "Điều chỉnh mức chắc chắn theo bằng chứng"], lessonTitles: ["Tiền đề và hệ quả", "Ngụy biện tinh vi", "Bằng chứng và độ chắc chắn", "Phản biện có thiện chí", "Cấu trúc thông tin", "Bảo vệ luận điểm C2"] },
  { id: "diplomacy-negotiation-c2", title: "Diplomacy & Negotiation C2", category: "Đàm phán", description: "Dùng tiếng Anh sắc thái cao để hòa giải, thương lượng và xử lý bất đồng trong môi trường quốc tế.", duration: "8 tuần", instructor: "EnglishMaster Global Communication", color: "orange", icon: "messages", outcomes: ["Giảm căng thẳng mà vẫn giữ lập trường", "Soạn thỏa thuận có điều kiện rõ ràng", "Ứng biến trong đàm phán phức tạp"], lessonTitles: ["Lập trường và lợi ích", "Ngôn ngữ giảm nhẹ", "Bế tắc và hòa giải", "Nhượng bộ có điều kiện", "Đồng thuận không giả tạo", "Mô phỏng hội nghị C2"] },
  { id: "ideas-society-c2", title: "Ideas, Systems & Society C2", category: "Học thuật liên ngành", description: "Đọc, nghe và thảo luận các vấn đề phức tạp về kinh tế, công nghệ, xã hội và môi trường.", duration: "10 tuần", instructor: "EnglishMaster Advanced Studies", color: "blue", icon: "book", outcomes: ["Tổng hợp nguồn liên ngành", "Diễn giải số liệu có giới hạn", "Viết và nói về hệ thống phức tạp"], lessonTitles: ["Con số và cách diễn giải", "Quyền lực và thể chế", "Công nghệ và trách nhiệm", "Khí hậu và đánh đổi", "Văn hóa và diễn ngôn", "Chuyên đề tổng hợp C2"] },
] as const;

export const c2Courses = courseSpecs.map(spec => ({
  id: spec.id,
  title: spec.title,
  level: "C2",
  category: spec.category,
  description: spec.description,
  duration: spec.duration,
  lessons: 6,
  rating: 4.9,
  instructor: spec.instructor,
  outcomes: [...spec.outcomes],
  color: spec.color,
  icon: spec.icon,
  premium: true,
}));

const vocabularyRanges = [17, 17, 17, 17, 16, 16];
const readingIds = c2Reading.map(item => item.id);
const listeningIds = c2Listening.map(item => item.id);

export const c2Lessons = courseSpecs.flatMap((course, courseIndex) => {
  let offset = courseIndex * 100;
  return course.lessonTitles.map((title, lessonIndex) => {
    const size = vocabularyRanges[lessonIndex];
    const vocabularyIds = Array.from({ length: size }, (_, index) => `c2v${String(offset + index + 1).padStart(3, "0")}`);
    offset += size;
    const questionStart = ((courseIndex * 6 + lessonIndex) * 4) % c2Questions.length;
    return {
      id: `${course.id}-${lessonIndex + 1}`,
      courseId: course.id,
      order: lessonIndex + 1,
      title,
      description: `Luyện cụm từ C2, cấu trúc lập luận, nghe, nói, đọc và viết qua chủ đề “${title}”.`,
      vocabularyIds,
      grammarId: c2Grammar[(courseIndex * 4 + lessonIndex) % c2Grammar.length].id,
      listeningId: listeningIds[lessonIndex],
      readingId: readingIds[lessonIndex],
      questionIds: Array.from({ length: 4 }, (_, index) => c2Questions[(questionStart + index) % c2Questions.length].id),
    };
  });
});

