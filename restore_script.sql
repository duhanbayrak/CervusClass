-- NOSONAR\n-- nosonar: plsql:S1192 - repeated literals are unavoidable in SQL data restore files
-- nosonar: plsql:LiteralsNonPrintableCharactersCheck - newlines in JSON literals are intentional data formatting

INSERT INTO exam_results (id, organization_id, student_id, exam_name, exam_date, scores, total_net, created_at, details, deleted_at, exam_type)
VALUES 
('c353cf51-fde9-4518-ad04-8d6c1f75f234', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'Özdebir Ayt Denemesi', '2026-02-18', '{"sosyal2":{"din":{"net":0,"dogru":0},"tarih2":{"net":0,"dogru":0},"felsefe":{"net":0,"dogru":0},"cografya2":{"net":0,"dogru":0},"toplam_net":0},"matematik":{"bos":0,"net":0,"dogru":0,"yanlis":0},"fen_bilimleri":{"fizik":{"net":0,"dogru":0,"yanlis":0},"kimya":{"net":0,"dogru":0,"yanlis":0},"biyoloji":{"net":0,"dogru":0,"yanlis":0},"toplam_net":0},"td_edebiyat_sos1":{"tarih1":{"net":0,"dogru":0,"yanlis":0},"edebiyat":{"net":0,"dogru":0,"yanlis":0},"cografya1":{"net":0,"dogru":0,"yanlis":0},"toplam_net":0}}'::jsonb, 0, '2026-02-18T22:16:50.155088+00:00', '{}'::jsonb, NULL, 'AYT'::exam_type_enum),
('bc9ba416-73f8-4031-86dd-b1ba543abe2f', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'Özdebir Ayt Denemesi', '2026-02-18', '{"fen":{"bos":0,"net":21,"dogru":0,"yanlis":0},"sosyal":{"bos":0,"net":7.25,"dogru":0,"yanlis":0},"turkce":{"bos":0,"net":0,"dogru":0,"yanlis":0},"matematik":{"bos":0,"net":25.5,"dogru":0,"yanlis":0}}'::jsonb, 21, '2026-02-18T22:41:21.97299+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('fe4b595d-9c0a-4fc9-b2e9-22653393caff', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'DAYZ Yayınları Ayt Deneme', '2026-02-18', '{"sosyal2":{"din":{"net":1.25,"dogru":2},"tarih2":{"net":11,"dogru":0},"felsefe":{"net":4,"dogru":5},"cografya2":{"net":11,"dogru":0},"toplam_net":27.25},"matematik":{"bos":0,"net":0,"dogru":8,"yanlis":32},"fen_bilimleri":{"fizik":{"net":13,"dogru":13,"yanlis":0},"kimya":{"net":10.75,"dogru":11,"yanlis":1},"biyoloji":{"net":7,"dogru":7,"yanlis":0},"toplam_net":30.75},"td_edebiyat_sos1":{"tarih1":{"net":7.5,"dogru":0,"yanlis":0},"edebiyat":{"net":18.25,"dogru":19,"yanlis":3},"cografya1":{"net":1,"dogru":0,"yanlis":0},"toplam_net":26.75}}'::jsonb, 84.75, '2026-02-18T23:02:22.851746+00:00', '{}'::jsonb, NULL, 'AYT'::exam_type_enum),
('eec5c71c-552f-4186-9844-2c2f748d4366', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'AYT DENEME', '2026-02-18', '{"sosyal2":{"din":{"bos":0,"net":6,"dogru":6,"yanlis":0},"tarih2":{"bos":3,"net":6.75,"dogru":7,"yanlis":1},"felsefe":{"bos":7,"net":1.25,"dogru":2,"yanlis":3},"cografya2":{"bos":0,"net":3.5,"dogru":5,"yanlis":6},"toplam_net":17.5},"matematik":{"bos":14,"net":23.5,"dogru":24,"yanlis":2},"fen_bilimleri":{"fizik":{"bos":1,"net":10.5,"dogru":11,"yanlis":2},"kimya":{"bos":2,"net":1,"dogru":3,"yanlis":8},"biyoloji":{"bos":5,"net":5.5,"dogru":6,"yanlis":2},"toplam_net":17},"td_edebiyat_sos1":{"tarih1":{"bos":6,"net":1.5,"dogru":2,"yanlis":2},"edebiyat":{"bos":2,"net":10.75,"dogru":13,"yanlis":9},"cografya1":{"bos":2,"net":1.5,"dogru":2,"yanlis":2},"toplam_net":13.75}}'::jsonb, 71.75, '2026-02-18T23:10:33.71024+00:00', '{}'::jsonb, NULL, 'AYT'::exam_type_enum),
('88775148-a847-40e3-ad6b-9478ab36f26c', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15 (1).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 24,
    "yanlis": 3,
    "net": 23.25
  },
  "Matematik": {
    "dogru": 22,
    "yanlis": 16,
    "net": 18
  },
  "Fen": {
    "dogru": 15,
    "yanlis": 0,
    "net": 15
  },
  "Sosyal": {
    "dogru": 20,
    "yanlis": 0,
    "net": 20
  }
}
'::jsonb, 76.25, '2026-02-15T20:30:42.285732+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('ec644147-5ab4-4c69-9648-984ac4fb2bba', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15 (2).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 28,
    "yanlis": 2,
    "net": 27.5
  },
  "Matematik": {
    "dogru": 34,
    "yanlis": 6,
    "net": 32.5
  },
  "Fen": {
    "dogru": 13,
    "yanlis": 3,
    "net": 12.25
  },
  "Sosyal": {
    "dogru": 11,
    "yanlis": 2,
    "net": 10.5
  }
}
'::jsonb, 82.75, '2026-02-15T20:31:04.243078+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('7e01d624-7a30-4336-b551-747465e4d24c', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15 (3).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 21,
    "yanlis": 4,
    "net": 20
  },
  "Matematik": {
    "dogru": 21,
    "yanlis": 19,
    "net": 16.25
  },
  "Fen": {
    "dogru": 19,
    "yanlis": 0,
    "net": 19
  },
  "Sosyal": {
    "dogru": 10,
    "yanlis": 3,
    "net": 9.25
  }
}
'::jsonb, 64.5, '2026-02-15T20:36:33.581238+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('2d09b4c5-749f-4823-95e7-7818e4d29627', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15 (4).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 30,
    "yanlis": 3,
    "net": 29.25
  },
  "Matematik": {
    "dogru": 35,
    "yanlis": 1,
    "net": 34.75
  },
  "Fen": {
    "dogru": 16,
    "yanlis": 1,
    "net": 15.75
  },
  "Sosyal": {
    "dogru": 16,
    "yanlis": 3,
    "net": 15.25
  }
}
'::jsonb, 95, '2026-02-15T20:36:57.049555+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('e7ac9640-17de-41cf-a9e0-c142a190c4ce', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-12 (2).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 35,
    "yanlis": 1,
    "net": 34.75
  },
  "Matematik": {
    "dogru": 20,
    "yanlis": 17,
    "net": 15.75
  },
  "Fen": {
    "dogru": 18,
    "yanlis": 0,
    "net": 18
  },
  "Sosyal": {
    "dogru": 15,
    "yanlis": 4,
    "net": 14
  }
}
'::jsonb, 82.5, '2026-02-12T17:20:46.858129+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('79c62952-ee1e-46d8-9096-d26e89d5dbdf', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15 (6).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 30,
    "yanlis": 10,
    "net": 27.5
  },
  "Matematik": {
    "dogru": 20,
    "yanlis": 6,
    "net": 18.5
  },
  "Fen": {
    "dogru": 12,
    "yanlis": 7,
    "net": 10.25
  },
  "Sosyal": {
    "dogru": 12,
    "yanlis": 3,
    "net": 11.25
  }
}
'::jsonb, 67.5, '2026-02-15T20:38:05.075119+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('3e13ca27-6bdc-449f-934d-38526a95f4b4', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15 (7).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 22,
    "yanlis": 1,
    "net": 21.75
  },
  "Matematik": {
    "dogru": 29,
    "yanlis": 4,
    "net": 28
  },
  "Fen": {
    "dogru": 17,
    "yanlis": 2,
    "net": 16.5
  },
  "Sosyal": {
    "dogru": 19,
    "yanlis": 0,
    "net": 19
  }
}
'::jsonb, 85.25, '2026-02-15T21:59:57.690656+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('f64f418a-c968-4069-a3fc-0620d3dcf9a9', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'Test Deneme', '2026-02-12', '{
  "Turkce": {
    "dogru": 36,
    "yanlis": 2,
    "net": 35.5
  },
  "Matematik": {
    "dogru": 17,
    "yanlis": 19,
    "net": 12.25
  },
  "Fen": {
    "dogru": 17,
    "yanlis": 2,
    "net": 16.5
  },
  "Sosyal": {
    "dogru": 11,
    "yanlis": 8,
    "net": 9
  }
}
'::jsonb, 73.25, '2026-02-15T22:03:59.720844+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('4004907a-8dcc-4e02-84d0-f1080eb8f576', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'Ayt Deneme', '2026-02-12', '{
  "Turkce": {
    "dogru": 31,
    "yanlis": 9,
    "net": 28.75
  },
  "Matematik": {
    "dogru": 27,
    "yanlis": 3,
    "net": 26.25
  },
  "Fen": {
    "dogru": 11,
    "yanlis": 9,
    "net": 8.75
  },
  "Sosyal": {
    "dogru": 11,
    "yanlis": 5,
    "net": 9.75
  }
}
'::jsonb, 73.5, '2026-02-17T14:21:54.651733+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('5bf5c89c-4372-4519-b3cb-e743b8dbe415', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15 (5).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 16,
    "yanlis": 0,
    "net": 16
  },
  "Matematik": {
    "dogru": 14,
    "yanlis": 7,
    "net": 12.25
  },
  "Fen": {
    "dogru": 20,
    "yanlis": 0,
    "net": 20
  },
  "Sosyal": {
    "dogru": 14,
    "yanlis": 5,
    "net": 12.75
  }
}
'::jsonb, 61, '2026-02-15T20:37:24.459651+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('428c1b0d-c5dd-42b1-99f6-3bc406e7aa08', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-12 (3).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 12,
    "yanlis": 18,
    "net": 7.5
  },
  "Matematik": {
    "dogru": 38,
    "yanlis": 2,
    "net": 37.5
  },
  "Fen": {
    "dogru": 10,
    "yanlis": 10,
    "net": 7.5
  },
  "Sosyal": {
    "dogru": 18,
    "yanlis": 2,
    "net": 17.5
  }
}
'::jsonb, 70, '2026-02-12T17:53:26.519701+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('2ba7ffcc-6b4b-4a56-8bb6-bae65c31b407', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-12 (4).xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 38,
    "yanlis": 0,
    "net": 38
  },
  "Matematik": {
    "dogru": 30,
    "yanlis": 9,
    "net": 27.75
  },
  "Fen": {
    "dogru": 18,
    "yanlis": 1,
    "net": 17.75
  },
  "Sosyal": {
    "dogru": 18,
    "yanlis": 0,
    "net": 18
  }
}
'::jsonb, 101.5, '2026-02-12T20:17:25.285657+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum),
('27f050dd-1103-464f-b1a2-0e17f9047432', '283442f5-d8c2-45da-94be-0c3770c96870', 'f6060fdb-247a-4b18-9b32-bb3d145eb6d4', 'mock_exam_2026-02-15.xlsx', '2026-02-12', '{
  "Turkce": {
    "dogru": 38,
    "yanlis": 0,
    "net": 38
  },
  "Matematik": {
    "dogru": 19,
    "yanlis": 10,
    "net": 16.5
  },
  "Fen": {
    "dogru": 13,
    "yanlis": 0,
    "net": 13
  },
  "Sosyal": {
    "dogru": 20,
    "yanlis": 0,
    "net": 20
  }
}
'::jsonb, 87.5, '2026-02-15T19:30:34.168914+00:00', '{}'::jsonb, NULL, 'TYT'::exam_type_enum)
ON CONFLICT (id) DO NOTHING;
