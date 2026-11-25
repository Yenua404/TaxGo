/* 2026년 11월 1일 이후 구매분에 적용되는 일본 소비세 환급 방식. */
window.TAXGO_QUIZ = (function () {
  var customs = { label: 'Japan Customs', url: 'https://www.customs.go.jp/kaigairyoko/taxrefund.htm' };
  var departure = { label: 'Japan Customs', url: 'https://www.customs.go.jp/kaigairyoko/taxrefund/C-details.html' };
  var reform = { label: 'National Tax Agency', url: 'https://www.nta.go.jp/publication/pamph/shohi/menzei/202506/pdf/0025006-106.pdf' };
  var notice = { label: 'National Tax Agency', url: 'https://www.nta.go.jp/publication/pamph/shohi/menzei/201805/pdf/caution_en.pdf' };
  var faq = { label: 'Japan Tourism Agency', url: 'https://www.mlit.go.jp/kankocho/tax-free/content/001991773.pdf' };
  var rates = { label: 'National Tax Agency', url: 'https://www.nta.go.jp/english/taxes/consumption_tax/01.htm' };

  return [
    {
      q: ['새 환급 방식에서는 면세점에서도 처음에 소비세를 포함한 가격을 결제한다.', 'リファンド方式では、免税店でも購入時はいったん消費税込みの金額を支払う。', 'Under the refund system, you pay the tax-inclusive price at the shop first.'],
      answer: true,
      why: ['살 때는 소비세를 포함해 결제하고, 출국 때 반출을 확인받은 뒤 소비세 상당액을 돌려받아요.', '購入時は税込みで支払い、出国時に持ち出しが確認された後に消費税相当額が返金されます。', 'You pay tax up front. The amount equivalent to the tax is refunded after Customs confirms export at departure.'],
      source: customs
    },
    {
      q: ['2026년 10월 31일에 산 물품도 11월에 출국하면 새 환급 방식이 적용된다.', '2026年10月31日に買った品物も、11月に出国すればリファンド方式の対象になる。', 'An item bought on October 31, 2026 switches to the new system if you leave Japan in November.'],
      answer: false,
      why: ['바뀐 방식은 2026년 11월 1일 이후 구매분부터 적용돼요. 기준은 출국일이 아니라 구매일이에요.', '新方式は2026年11月1日以降の購入分から。基準は出国日ではなく購入日です。', 'The new system applies to purchases from November 1, 2026. The purchase date determines which system applies.'],
      source: customs
    },
    {
      q: ['한 면세점에서 하루에 산 대상 물품의 합계가 세전 5,000엔이면 금액 기준을 충족한다.', '同じ免税店で1日に買った対象品の合計が税抜5,000円なら、金額の条件を満たす。', 'Exactly ¥5,000 before tax in eligible purchases at one tax-free shop on one day meets the spending threshold.'],
      answer: true,
      why: ['구매액 기준은 한 매장에서 같은 날 산 대상 물품의 세전 합계 5,000엔 이상이에요.', '同一店舗で同じ日に購入した対象品の税抜合計が5,000円以上なら金額の条件を満たします。', 'The minimum is ¥5,000 before tax for eligible purchases at the same shop on the same day.'],
      source: customs
    },
    {
      q: ['A점에서 세전 3,000엔, B점에서 세전 2,000엔을 쓰면 두 매장 금액을 합쳐 면세 기준을 채울 수 있다.', 'A店で税抜3,000円、B店で税抜2,000円使えば、合算して免税の金額条件を満たせる。', 'You can combine ¥3,000 before tax at Shop A with ¥2,000 at Shop B to reach the minimum.'],
      answer: false,
      why: ['서로 다른 매장의 구매액은 합산할 수 없어요. 금액은 매장별·구매일별로 계산해요.', '店舗が異なる購入額は合算できません。店舗ごと、購入日ごとに判定します。', 'Purchases at different shops cannot be combined. The threshold is assessed per shop, per day.'],
      source: customs
    },
    {
      q: ['11월 1일에 샀다면 출국 시 세관 확인 기한은 다음 해 1월 30일이다.', '11月1日に購入した場合、出国時の税関確認期限は翌年1月30日である。', 'For a purchase on November 1, the deadline for Customs confirmation at departure is January 30 of the following year.'],
      answer: true,
      why: ['구매 다음 날부터 90일을 세어요. 11월 1일 구매라면 11월 2일이 첫날이고 1월 30일이 90일째예요.', '購入日の翌日から90日を数えます。11月1日に買うと、11月2日が1日目で、翌年1月30日が90日目です。', 'Count 90 days starting the day after purchase. November 2 is day one and January 30 is day 90.'],
      source: reform
    },
    {
      q: ['새 방식에서도 과자와 화장품을 면세 전용 포장으로 밀봉해야 한다.', 'リファンド方式でも、お菓子や化粧品は免税用の特殊包装で封をする必要がある。', 'The new system still requires special tax-free packaging for snacks and cosmetics.'],
      answer: false,
      why: ['새 방식에서는 소모품 특별 포장 요건이 없어졌어요. 물품을 일본 밖으로 가져가야 하는 조건은 여전히 적용돼요.', '消耗品の特殊包装は廃止されました。購入品を日本国外へ持ち出す必要はあります。', 'The special packaging requirement for consumables was removed. You still have to take the items out of Japan.'],
      source: faq
    },
    {
      q: ['특별 포장이 없어졌으니 환급받을 과자를 일본에서 먹어도 된다.', '特殊包装がなくなったので、還付を受けるお菓子を日本国内で食べてもよい。', 'Now that special packaging is gone, you can eat the snacks in Japan and still get the refund.'],
      answer: false,
      why: ['포장이 필요 없어도 일본에서 먹거나 사용한 소모품은 환급받을 수 없어요. 현지에서 먹을 과자는 따로 사는 편이 쉬워요.', '特殊包装は不要でも、日本国内で消費した品物は還付を受けられません。現地で食べるお菓子は別に買うと分かりやすくなります。', 'Consumables used in Japan lose refund eligibility even without special packaging. Buying snacks for your stay separately keeps things simple.'],
      source: faq
    },
    {
      q: ['한 영수증의 면세 대상 물품 중 하나라도 없으면 그 거래 전체가 환급을 받을 수 없다.', '同じレシートの免税対象品を一つでも持っていなければ、その取引全体が還付の対象外になる。', 'If one eligible item on a receipt is missing, the whole transaction loses refund eligibility.'],
      answer: true,
      why: ['세관은 영수증 등 구매 기록 단위로 확인해요. 같은 기록의 대상 물품을 모두 가지고 있어야 해요.', '税関確認はレシートなどの購入記録ごとに行われ、同じ記録に含まれる対象品をすべて所持している必要があります。', 'Customs evaluates each purchase record as a unit. You must have every eligible item on that record.'],
      source: reform
    },
    {
      q: ['금괴도 여행객 소비세 환급 대상 물품에 포함된다.', '金地金も旅行者向け消費税還付の対象品に含まれる。', 'Gold bullion qualifies for the traveler consumption tax refund.'],
      answer: false,
      why: ['금괴와 백금괴는 환급 대상에서 제외돼요. 원래 소비세가 부과되지 않는 물품도 대상이 아니에요.', '金地金や白金地金は対象外です。もともと消費税が非課税の品物も対象外です。', 'Gold and platinum bullion are excluded, as are goods that were not subject to consumption tax in the first place.'],
      source: customs
    },
    {
      q: ['환급 대상 물품은 출국할 때 본인이 직접 가져갈 수 있는 양이어야 한다.', '還付を受ける品物は、出国時に自分で持ち出せる量である必要がある。', 'Refund-eligible purchases must be limited to what you can personally carry out of Japan.'],
      answer: true,
      why: ['직접 가지고 출국할 수 있는 수량만 대상이에요. 세관이 요청할 때 물품을 보여줄 수 있어야 해요.', '自分で持ち出せる数量に限られます。税関に求められたら購入品を提示できるようにしてください。', 'You must be able to carry the goods out yourself and show them if Customs asks.'],
      source: notice
    },
    {
      q: ['환급받을 물품이 든 짐을 항공사에 먼저 맡겨도 세관 확인을 받을 수 있다.', '還付を受ける品物が入った荷物を先に預けても、税関確認を受けられる。', 'You can check a bag containing your refund items before completing Customs confirmation.'],
      answer: false,
      why: ['환급 대상품을 보여 달라고 할 수 있어요. 물품이 든 짐을 맡기기 전에 세관 확인을 마쳐야 해요.', '税関が品物の提示を求めることがあります。品物を入れた荷物を預ける前に税関確認を済ませます。', 'Customs may ask to see the goods. Complete confirmation before checking the bag that contains them.'],
      source: notice
    },
    {
      q: ['출국용 단말기에 빨간색 결과가 뜨면 지정된 세관 검사 장소로 가야 한다.', '出国時の端末で赤の結果が出たら、指定の税関検査場所へ行く必要がある。', 'A red result on the departure terminal means you must go to the designated Customs inspection area.'],
      answer: true,
      why: ['빨간색은 물품 검사가 필요하다는 뜻이에요. 환급 대상 물품을 가지고 안내된 장소로 가세요.', '赤は現物検査が必要という判定です。還付対象品を持って案内された場所へ向かいます。', 'Red means a physical inspection is required. Take the goods to the designated area.'],
      source: customs
    },
    {
      q: ['출국용 단말기에 초록색 결과가 떠도 반드시 검사대에서 물품을 하나씩 보여줘야 한다.', '端末で緑の結果が出ても、必ず検査場で品物を一つずつ見せる必要がある。', 'Even with a green result, you must always show every item at an inspection counter.'],
      answer: false,
      why: ['초록색 결과는 별도 물품 검사 없이 세관 확인 절차가 끝났다는 뜻이에요.', '緑なら現物検査は不要で、その場で税関確認の手続きが完了します。', 'Green means no physical inspection is required and the Customs confirmation is complete.'],
      source: customs
    },
    {
      q: ['일본 국내선에서 국제선으로 갈아타면, 일본을 최종 출국하는 공항에서 세관 확인을 받는다.', '国内線から国際線へ乗り継ぐ場合、日本を最終出国する空港で税関確認を受ける。', 'If you connect from a domestic flight to an international one, complete Customs confirmation at your final airport of departure from Japan.'],
      answer: true,
      why: ['예를 들어 국내선으로 하네다에 와서 한국행 국제선에 타면, 일본을 떠나는 하네다에서 확인받아요.', 'たとえば国内線で羽田に着き、羽田から韓国へ飛ぶなら、日本を出る羽田で手続きをします。', 'For example, if you fly domestically into Haneda and then fly from Haneda to Korea, you complete the procedure at Haneda.'],
      source: departure
    },
    {
      q: ['Visit Japan Web으로 환급용 출국 확인을 하려면 호텔 와이파이로 미리 끝내면 된다.', 'Visit Japan Webで出国時の還付手続きができるので、ホテルのWi-Fiで先に済ませられる。', 'You can finish the Visit Japan Web departure procedure from your hotel Wi-Fi.'],
      answer: false,
      why: ['지원 공항의 국제선 출국 로비에서 보안검색 전에 전용 와이파이에 연결해야 온라인 절차를 진행할 수 있어요.', '対応空港の国際線出発ロビーで、保安検査前に専用無線LANへ接続して手続きします。', 'Use the dedicated network in the international departure lobby of a participating airport before security.'],
      source: customs
    },
    {
      q: ['출국할 때 환급 절차 단말기를 이용하려면 여권을 제시한다.', '出国時に免税手続き端末を使う場合は、パスポートを提示する。', 'When using a tax-refund terminal at departure, you present your passport.'],
      answer: true,
      why: ['공항이나 항구의 절차 단말기에 여권을 제시해 세관 확인을 진행해요.', '空港や港の端末でパスポートを提示し、税関確認を進めます。', 'Present your passport at the terminal at the airport or seaport to complete the Customs procedure.'],
      source: customs
    },
    {
      q: ['세관 확인이 끝나면 항상 세관 창구에서 즉시 현금으로 환급해 준다.', '税関確認が終わると、必ず税関窓口でその場で現金を受け取れる。', 'Customs always hands you an immediate cash refund once it confirms export.'],
      answer: false,
      why: ['세관은 물품 반출을 확인해요. 실제 환급은 면세 판매점이 등록된 방법을 통해 처리하므로 구매할 때 방법을 확인해 두세요.', '税関は持ち出しを確認します。返金は免税店が登録された方法で行うので、購入時に確認しておくと安心です。', 'Customs confirms export. The shop processes the refund using the method registered for your purchase.'],
      source: departure
    },
    {
      q: ['새 환급 방식에서는 소모품에 적용되던 50만 엔 상한이 없어졌다.', 'リファンド方式では、消耗品に適用されていた50万円の上限が廃止された。', 'The new system removed the ¥500,000 cap that used to apply to consumables.'],
      answer: true,
      why: ['소모품과 일반 물품의 구분이 없어지면서 소모품 전용 상한도 폐지됐어요. 직접 반출할 수 있는 수량이어야 한다는 조건은 여전히 적용돼요.', '一般物品と消耗品の区分とともに、消耗品だけの上限もなくなりました。自分で持ち出せる数量に限られる点は同じです。', 'The separate consumables category and its cap were removed. You still have to be able to take the goods out yourself.'],
      source: reform
    },
    {
      q: ['일본에서는 술도 식품과 같은 소비세 경감세율 8% 대상이다.', '日本では酒類にも食品と同じ消費税の軽減税率8％が適用される。', 'Alcoholic drinks qualify for the same reduced 8% consumption tax rate as eligible foods.'],
      answer: false,
      why: ['술은 식품·음료 경감세율 대상에서 제외돼요. 과세 판매 시 표준세율은 10%예요.', '酒類は飲食料品の軽減税率の対象外です。課税される販売には標準税率の10％が適用されます。', 'Alcohol is excluded from the reduced food and drink rate. The standard rate on taxed sales is 10%.'],
      source: rates
    },
    {
      q: ['세관 확인을 받은 면세 물품도 일본에 남기지 말고 지체 없이 반출해야 한다.', '税関確認を受けた免税品も、日本に残さず遅滞なく持ち出す必要がある。', 'After Customs confirmation, you must still take the refund items out of Japan without delay.'],
      answer: true,
      why: ['세관 확인 자체가 반출 의무를 없애지는 않아요. 확인받은 물품은 실제로 일본 밖으로 가져가야 해요.', '税関確認が済んでも持ち出す義務はなくなりません。確認を受けた品物は実際に日本国外へ持ち出します。', 'Customs confirmation does not remove the export requirement. You must actually take the confirmed goods out of Japan.'],
      source: notice
    }
  ];
})();
