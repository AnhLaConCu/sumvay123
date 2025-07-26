const axios = require("axios");

const API_URL = "https://taixiumd5.system32-cloudfare-356783752985678522.monster/api/md5luckydice/GetSoiCau";

// Hàm xác định Tài (t) hay Xỉu (x)
function getTaiXiu(sum) {
  return sum >= 11 ? 't' : 'x';
}

// Tạo pattern từ kết quả trước đó
function buildPattern(data) {
  return data.map(v => getTaiXiu(v.DiceSum)).join('');
}

// Dự đoán kết quả tiếp theo bằng thuật toán Markov nâng cao
function predictNext(pattern) {
  // Markov Chain bậc 3
  const order = 3;
  const map = {};

  // Tạo bảng tần suất mẫu cầu
  for (let i = 0; i < pattern.length - order; i++) {
    const prefix = pattern.slice(i, i + order);
    const next = pattern[i + order];
    if (!map[prefix]) map[prefix] = { t: 0, x: 0 };
    map[prefix][next]++;
  }

  // Dự đoán dựa trên pattern hiện tại
  const last = pattern.slice(-order);
  const predict = map[last];
  if (!predict) return { ketqua: 'Không đủ dữ liệu', tin_cay: 0, phan_tich: map[last] };

  const result = predict.t > predict.x ? 't' : 'x';
  const confidence = ((Math.max(predict.t, predict.x) / (predict.t + predict.x)) * 100).toFixed(1);

  return {
    ketqua: result,
    tin_cay: confidence + '%',
    phan_tich: map[last]
  };
}

async function fetchData() {
  try {
    const res = await axios.get(API_URL);
    const list = res.data;

    if (!Array.isArray(list)) throw new Error("Không phải mảng JSON!");

    // Tạo pattern từ kết quả trước đó
    const pattern = buildPattern(list);

    // Lấy phiên hiện tại
    const current = list[0];

    // Dự đoán kết quả
    const du_doan = predictNext(pattern);

    // Trả kết quả dưới dạng JSON
    const result = {
      version: current.SessionId + 1,
      pattern: pattern,
      last_result: {
        first_dice: current.FirstDice,
        second_dice: current.SecondDice,
        third_dice: current.ThirdDice,
        dice_sum: current.DiceSum,
        bet_side: getTaiXiu(current.DiceSum) === 't' ? 'TÀI' : 'XỈU'
      },
      prediction: {
        result: du_doan.ketqua === 't' ? 'TÀI' : 'XỈU',
        confidence: du_doan.tin_cay,
        analysis: du_doan.phan_tich
      }
    };

    // In kết quả JSON
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu:", err.message);
  }
}

// Lấy dữ liệu và dự đoán
fetchData();
