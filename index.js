const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

const API_URL = "https://taixiumd5.system32-cloudfare-356783752985678522.monster/api/md5luckydice/GetSoiCau";

// Xác định tài/xỉu
const getTaiXiu = sum => (sum >= 11 ? 't' : 'x');

// Tạo pattern từ dữ liệu lịch sử
const buildPattern = data => data.map(v => getTaiXiu(v.DiceSum)).join('');

// Dự đoán bằng Markov Chain nâng cao
function predictNext(pattern) {
  const order = 3;
  const map = {};

  for (let i = 0; i < pattern.length - order; i++) {
    const prefix = pattern.slice(i, i + order);
    const next = pattern[i + order];
    if (!map[prefix]) map[prefix] = { t: 0, x: 0 };
    map[prefix][next]++;
  }

  const last = pattern.slice(-order);
  const predict = map[last];
  if (!predict) return { ketqua: 'Không đủ dữ liệu', tin_cay: "0%", phan_tich: {} };

  const result = predict.t > predict.x ? 't' : 'x';
  const confidence = ((Math.max(predict.t, predict.x) / (predict.t + predict.x)) * 100).toFixed(1);

  return {
    ketqua: result,
    tin_cay: confidence + '%',
    phan_tich: predict
  };
}

// Endpoint API trả về JSON
app.get("/api/taixiu", async (req, res) => {
  try {
    const response = await axios.get(API_URL);
    const list = response.data;

    if (!Array.isArray(list)) {
      return res.status(500).json({ error: "Dữ liệu API không hợp lệ!" });
    }

    const pattern = buildPattern(list);
    const current = list[0];
    const prediction = predictNext(pattern);

    res.json({
      version: current.SessionId + 1,
      pattern,
      last_result: {
        session_id: current.SessionId,
        first_dice: current.FirstDice,
        second_dice: current.SecondDice,
        third_dice: current.ThirdDice,
        dice_sum: current.DiceSum,
        bet_side: getTaiXiu(current.DiceSum) === 't' ? 'TÀI' : 'XỈU'
      },
      prediction: {
        result: prediction.ketqua === 't' ? 'TÀI' : 'XỈU',
        confidence: prediction.tin_cay,
        analysis: prediction.phan_tich
      }
    });

  } catch (err) {
    res.status(500).json({ error: "Lỗi khi gọi API: " + err.message });
  }
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}/api/taixiu`);
});
