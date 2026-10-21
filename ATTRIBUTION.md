# Vocabulary data attribution

The generated vocabulary SQL files in `prisma/` combine English headwords, definitions, CEFR labels, and frequency rankings from [Openjam](https://github.com/amirj4m/openjam) (MIT) with Vietnamese meanings, IPA, and example sentences from [Skypedia's English–Vietnamese Dictionary](https://github.com/skypediacode/english-vietnamese-dictionary) (CC BY-SA 4.0). The latter is derived from the [MinhQND Dictionary](https://github.com/minhqnd/dictionary) and acknowledges Wiktionary, vntk/dictionary, Hồ Ngọc Đức's Vietnamese Dictionary Project, and OVDP. See the [source attribution](https://github.com/skypediacode/english-vietnamese-dictionary/blob/main/ATTRIBUTION.md) and [license](https://github.com/skypediacode/english-vietnamese-dictionary/blob/main/LICENSE) for full upstream credits and redistribution terms.

The combined and reformatted vocabulary dataset is distributed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Please retain this attribution when redistributing the SQL files or data derived from them.

## Chinese vocabulary expansion (3,000 entries)

`prisma/data/chinese-vocabulary-3000.json` is an adapted dataset under **CC BY-SA 4.0**. Sources:

- [Complete HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary), Yanis Zafirópulos: headwords, Pinyin, upstream `new-N` (HSK 3.0 / 2021) labels and English definitions. Its code is MIT; dictionary definitions originate in CC-CEDICT and retain their ShareAlike terms.
- [CVDICT](https://github.com/ph0ngp/CVDICT), Phong Phan, derived from CC-CEDICT: Vietnamese meanings, using the preserved [thaoshibe mirror](https://github.com/thaoshibe/chugiai-zh-en-vi) because the original repository was unavailable when this artifact was built. Both mirror and original project identify the dictionary as CC BY-SA 4.0. The upstream dictionary used AI-assisted translation and warns about residual errors.
- [hsk-sentences-audio](https://github.com/no7z/hsk-sentences-audio), no7z and contributors: example sentence text, Pinyin, and English translations retained as provenance. Data is CC BY-SA 4.0; its code-only MIT license does not replace the data license. CC-CEDICT contributors are credited for underlying Pinyin/glosses. No audio or voice/model files are copied; playback uses the browser's speech synthesis.

Changes: selected 3,000 unique Han headwords excluding the 24 hand-authored starter words; rejected mismatched dictionary pronunciations; joined examples by exact segmented word plus normalized reading; preferred short, lower-level sentences; reformatted fields and mapped labels to app levels. Word meanings are Vietnamese, but **new example-sentence Vietnamese translations are intentionally empty**, supplied by the app's existing on-demand AI translation only when configured. Data is community-provided and not independently proofread in full; HSK labels are not official certification or CEFR equivalences.

Pinned commits, source SHA-256 digests, exact row counts, changes and the full upstream MIT notice are in [the public provenance manifest](public/data/chinese-vocabulary-attribution.json), also served to learners at `/data/chinese-vocabulary-attribution.json`. Retain the manifest, these credits and [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) when redistributing the dataset or adaptations. The original 24 starter words/lessons were authored separately, not copied from these sources.

## Dữ liệu thứ tự nét chữ Hán

Tính năng **Cách viết chữ Hán** tải từng chữ từ [Hanzi Writer Data 2.0.1](https://www.npmjs.com/package/hanzi-writer-data/v/2.0.1) trên jsDelivr khi người học mở hộp thoại. Không đóng gói lại hoặc thay đổi dữ liệu nét chữ trong repository này.

Nguồn: [chanind/hanzi-writer-data](https://github.com/chanind/hanzi-writer-data), dựa trên [Make Me a Hanzi](https://github.com/skishore/makemeahanzi), trích xuất từ font Arphic Technology Co., Ltd. Dữ liệu theo [Arphic Public License](https://github.com/chanind/hanzi-writer-data/blob/master/ARPHICPL.TXT), tách biệt với giấy phép mã ứng dụng. Phiên bản dữ liệu được cố định ở `src/lib/hanzi-strokes.ts`; nét SVG và đường tâm được giữ đúng thứ tự của nguồn. Đây không phải chứng nhận/chấm điểm viết chữ của người học.

Mã luyện viết sử dụng [Hanzi Writer 3.7.3](https://github.com/chanind/hanzi-writer) ([MIT](https://github.com/chanind/hanzi-writer/blob/master/LICENSE)); khác với giấy phép Arphic của dữ liệu nét. Chuyển chữ/câu sang Bính âm sử dụng [pinyin-pro 3.29.5](https://github.com/zh-lx/pinyin-pro) ([MIT](https://github.com/zh-lx/pinyin-pro/blob/main/LICENSE)). Hai thư viện được cài qua npm và đóng gói cùng ứng dụng, không gửi câu ví dụ tới dịch vụ chuyển Pinyin bên ngoài.
