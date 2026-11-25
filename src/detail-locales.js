/* Place-specific presentation translations. Identifiers and calculation data are unchanged. */
window.TAXGO_DETAILS = {
  airports: {
    fuk: {
      name: ['福岡空港 国際線', 'Fukuoka Airport – International'], short: ['福岡', 'Fukuoka'],
      kiosk: ['国際線3階・南側 J–M カウンター前', 'International 3F, in front of south J–M counters'],
      red: ['キオスク横の税関確認所でパスポートと購入品を提示（06:00–21:00）', 'Show your passport and items at the customs desk beside the kiosk (06:00–21:00)'],
      cash: ['出国審査後の免税エリア・HAKATA FOOD HALL入口横（端末06:00–21:00、カウンター07:00–21:00）', 'After immigration, duty-free area beside HAKATA FOOD HALL (terminal 06:00–21:00, desk 07:00–21:00)'],
      note: ['スマートフォンでの確認には、3階出発ロビーの専用Wi-Fiが必要です。', 'Mobile verification requires the customs Wi-Fi in the 3F departure lobby.']
    },
    hkt: { name: ['博多港国際ターミナル（船）', 'Hakata Port International Terminal (ferry)'], short: ['博多港', 'Hakata Port'],
      kiosk: ['乗船手続き前のエリア（場所を現地で確認）', 'Before boarding check-in (confirm location onsite)'],
      red: ['税関職員にパスポートと購入品を提示してください。', 'Show your passport and purchases to a customs officer.'],
      cash: ['購入店が案内した還付方法をご確認ください。', 'Check the refund method provided by your retailer.'],
      note: ['釜山行きの船も対象です。端末の場所は現地で確認してください。', 'Ferries to Busan may qualify. Check terminal locations onsite.'] },
    kix1: { name: ['関西国際空港 第1ターミナル', 'Kansai Airport Terminal 1'], short: ['関空T1', 'Kansai T1'],
      kiosk: ['4階国際線出発ロビー、手荷物預け前', '4F international departure lobby, before bag drop'],
      red: ['4階税関検査場でパスポートと購入品を提示してください。', 'Show passport and items at the 4F customs inspection area.'],
      cash: ['購入店が案内した還付方法をご確認ください。', 'Check the refund method provided by your retailer.'],
      note: ['混雑時は専用Wi-Fiを使ったスマートフォンでの確認をおすすめします。', 'If crowded, use mobile verification via dedicated Wi-Fi.'] },
    kix2: { name: ['関西国際空港 第2ターミナル', 'Kansai Airport Terminal 2'], short: ['関空T2', 'Kansai T2'],
      kiosk: ['チェックインロビー、保安検査前', 'Check-in lobby, before security'],
      red: ['チェックインロビーの税関検査場でパスポートと購入品を提示してください。', 'Show passport and items at the customs desk in the check-in lobby.'],
      cash: ['購入店が案内した還付方法をご確認ください。', 'Check the refund method provided by your retailer.'] },
    hnd3: { name: ['羽田空港 第3ターミナル', 'Haneda Airport Terminal 3'], short: ['羽田T3', 'Haneda T3'],
      kiosk: ['3階、保安検査前のエリア', '3F, before security screening'],
      red: ['出発ロビーの税関検査場でパスポートと購入品を提示してください。', 'Show passport and items at departure-lobby customs.'],
      cash: ['保安検査後の3階 Self Tax Refund 端末（5台・24時間）。対応店舗の購入品のみ', 'Self Tax Refund terminal after security on 3F (5 machines, 24h); eligible retailers only.'] },
    hnd2: { name: ['羽田空港 第2ターミナル', 'Haneda Airport Terminal 2'], short: ['羽田T2', 'Haneda T2'],
      kiosk: ['3階、保安検査前のエリア', '3F, before security screening'],
      red: ['出発ロビーの税関検査場でパスポートと購入品を提示してください。', 'Show passport and items at departure-lobby customs.'],
      cash: ['保安検査後の3階 Self Tax Refund 端末（5台・06:45–翌01:30）。対応店舗の購入品のみ', 'Self Tax Refund terminal after security on 3F (5 machines, 06:45–01:30 next day); eligible retailers only.'],
      note: ['第1ターミナルでは免税確認を実施していません。', 'Tax-free verification is not available at Terminal 1.'] },
    ngo1: { name: ['中部国際空港セントレア 第1ターミナル', 'Chubu Centrair Airport Terminal 1'], short: ['中部T1', 'Chubu T1'],
      kiosk: ['国際線チェックインカウンター前', 'In front of international check-in counters'],
      red: ['キオスク付近の税関確認所でパスポートと購入品を提示してください。', 'Show passport and purchases at customs near the kiosk.'],
      cash: ['3階出発ロビーの現金還付カウンター・端末（日本円のみ）', 'Cash refund desk and machines in 3F departures (JPY only)'],
      note: ['混雑時はキオスク付近でスマートフォンでも確認可能です。', 'Mobile verification is also available near the kiosk when crowded.'] },
    other: { name: ['その他の空港・港', 'Other airports / ports'], short: ['その他', 'Other'],
      kiosk: ['国際線出発ロビー、手荷物預け前', 'International departure lobby, before baggage drop'],
      red: ['キオスク付近の税関検査場でパスポートと購入品を提示してください。', 'Show passport and purchases at customs near the kiosk.'],
      cash: ['購入店が案内した還付方法をご確認ください。', 'Check the refund method provided by your retailer.'],
      note: ['成田・新千歳・那覇空港でもVisit Japan Webによるスマートフォン確認が可能です。', 'Mobile verification via Visit Japan Web is available at Narita, New Chitose and Naha too.'] }
  },
  checklist: [
    { title: ['空港に到着する', 'Arrive at the airport'] },
    { title: ['免税品を提示できるように準備', 'Keep tax-free purchases accessible'], desc: ['レシートごとにまとめて、すぐ見せられるようにします。', 'Group items by receipt and keep them easy to present.'] },
    { title: ['キオスクでパスポートをスキャン', 'Scan passport at the kiosk'] },
    { title: ['REDなら税関で確認', 'If RED, go to customs'] },
    { title: ['チェックイン・手荷物を預ける', 'Check in and drop bags'], desc: ['確認が終わってから荷物を預けます。', 'Drop off your bags only after verification.'] },
    { title: ['保安検査・出国審査', 'Security and immigration'], desc: ['通過後は出発ロビーに戻れません。', 'You cannot return to the departure lobby afterward.'] },
    { title: ['現金還付を受ける', 'Collect your cash refund'] }
  ],
  reminders: {
    eve: { title: ['免税品を食べたり使ったりしない', 'Keep all tax-free purchases unused'], body: ['品物が一つでも欠けるとレシート全体が還付対象外です。レシート別にまとめてください。', 'If an item is missing, the whole receipt may become ineligible. Group items by receipt.'] },
    day: { title: ['チェックインより先にキオスクへ', 'Visit the kiosk before check-in'], body: ['荷物を預けた後は税関確認ができません。', 'Customs verification must happen before you check in your bags.'] },
    refund: { title: ['還付金の入金を確認', 'Check that your refund arrived'], body: ['カード・口座への還付は出国後です。届かない場合は購入店にお問い合わせください。', 'Card and bank refunds arrive after departure. Contact your retailer if missing.'] },
    guard: { title: ['90日以内の出国期限まであと7日', 'Seven days until the 90-day deadline'], body: ['期限内の出国が必要です。', 'You must depart within the permitted period.'] }
  }
};
