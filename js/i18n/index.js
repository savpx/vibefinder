// Поддерживаемые языки интерфейса: русский (по умолчанию) и английский.
const localeCodes = ['ru', 'en'];
const localeMetadata = {
  ru: { code: 'RU', htmlLang: 'ru', title: 'Русский' },
  en: { code: 'EN', htmlLang: 'en', title: 'English' },
};

// Каталог переводов: ключ — русский текст (источник), значение — английский.
const translationCatalog = {
"Vibe Finder": "Vibe Finder",
"Найди свою атмосферу.": "Find your own atmosphere.",
"14 вайбов. 14 разных миров.": "14 vibes. 14 different worlds.",
"Каталог": "Catalog",
"Логотип колледжа IT.Москва": "IT.Moscow college logo",
"Атмосфера": "Vibe",
"Открой мир, который подстроится под тебя.": "Open a world that adapts to you.",
"created by the Bsoul team": "created by the Bsoul team",
"Найди своё настроение и войди в атмосферу, которая подстроится под тебя.": "Find your mood and step into an atmosphere made for you.",
"Поиск": "Search",
"14 атмосфер · 10 вопросов": "14 atmospheres · 10 questions",
"Атмосферы": "Atmospheres",
"Вопрос 1 из 10": "Question 1 of 10",
"Вернуться к предыдущему вопросу": "Back to the previous question",
"Прогресс опроса": "Quiz progress",
"Опрос": "Your questions",
"Какое у тебя настроение прямо сейчас?": "How are you feeling right now?",
"Спокойно": "Calm",
"Тревожно": "Anxious",
"Энергично": "Energetic",
"Хочу отдохнуть": "I need to rest",
"Какая энергия ближе к тебе?": "Which kind of energy feels closest to you?",
"Лёгкая и мягкая": "Light and gentle",
"Жаркая и активная": "Warm and lively",
"Ночные импульсы": "Late-night sparks",
"Хочется перезагрузки": "Time to recharge",
"Что хочется сделать прямо сейчас?": "What would you like to do right now?",
"Побыть в тишине": "Spend some time in quiet",
"Создать волну": "Make a ripple",
"Погрузиться в ритм": "Sink into a rhythm",
"Сделать паузу и восстановиться": "Pause and recharge",
"Какой тип общения тебя сейчас тянет?": "What kind of company feels right right now?",
"Тихий и уютный": "Quiet and cozy",
"Весёлый и живой": "Lively and cheerful",
"Креативный и яркий": "Creative and colorful",
"В одиночестве": "On my own",
"Что лучше всего подходит под твой ритм?": "What best matches your pace?",
"Медленные мысли": "Slow, unhurried thoughts",
"Движение и свет": "Movement and light",
"Неоновая энергия": "Neon energy",
"Тихая перезагрузка": "A quiet reset",
"В каком месте мысли становятся твоими?": "Where do your thoughts feel most like your own?",
"На пустой ночной улице": "On a quiet street at night",
"У окна, пока идёт дождь": "By a window while it rains",
"В мастерской с музыкой и красками": "In a studio with music and paint",
"На солнечной тропе среди деревьев": "On a sunlit path among trees",
"Какой темп сегодня ощущается правильным?": "What pace feels right today?",
"Медленно, как ровное дыхание": "Slow, like an even breath",
"Спокойно, но с искрой любопытства": "Easygoing, with a spark of curiosity",
"Быстро и без плана": "Fast and spontaneous",
"Игриво, чтобы хотелось улыбаться": "Playful enough to make me smile",
"Кого бы ты позвал разделить этот момент?": "Who would you invite to share this moment?",
"Никого — хочется личного пространства": "No one — I want some space",
"Одного близкого человека": "Someone close to me",
"Всех, кто готов на спонтанность": "Anyone up for something spontaneous",
"Себя — на прогулку без маршрута": "Myself, for a walk with no destination",
"Какой кадр хочется оставить перед глазами?": "What scene would you like to keep in mind?",
"Неон в отражении мокрого асфальта": "Neon reflected on wet pavement",
"Туманное утро и мягкие оттенки": "A misty morning in soft colors",
"Пиксельный закат и яркие контуры": "A pixel sunset with bright outlines",
"Тёплая комната в свете лампы": "A warm room lit by a lamp",
"Что было бы приятнее сделать прямо сейчас?": "What would feel nicest to do right now?",
"Исследовать тайное место": "Explore a hidden place",
"Что-нибудь нарисовать или придумать": "Draw or imagine something",
"Сыграть короткий аркадный раунд": "Play a quick arcade round",
"Устроиться поудобнее и ничего не спешить": "Get comfortable and take your time",
"Создание твоего вайба": "Creating your vibe",
"Вернуться в начало": "Return to start",
"↩ Вернуться": "↩ Back",
"Меню результата": "Result menu",
"Открыть меню": "Open menu",
"Вернуться": "Return",
"Поделиться моим вайбом": "Share my vibe",
"МОЙ ВАЙБ СЕГОДНЯ": "MY VIBE TODAY",
"Узнай, какой вайб у тебя сегодня!": "Discover your vibe today!",
"Поделиться": "Share",
"Скопировано!": "Copied!",
"Не удалось поделиться. Попробуй ещё раз.": "Unable to share right now. Please try again.",
"Неизвестный вайб": "Unknown vibe",
"Показать следующую цитату": "Show the next quote",
"Discord community support": "Discord community support",
"Вайб-цитата": "A thought for this vibe",
"ТВОЙ ВАЙБ": "YOUR VIBE",
"Мини-игра": "Mini Game",
"Премиум вайб": "Your vibe",
"Затерянный в космосе": "Lost in Space",
"Плавное тёмно-фиолетовое пространство, мягкие звёзды и медитативная глубина. Здесь можно замедлиться и собраться с мыслями.": "A deep, dusky space with gentle stars and room to slow down and gather your thoughts.",
"Тишина — это тоже движение. Просто очень красивое.": "Silence is a kind of movement, too — a beautiful one.",
"Звёзды не спешат — и это делает их ближе.": "The stars take their time, and that brings them closer.",
"Каждая пауза — это маленький космос для себя.": "Every pause is a little universe of your own.",
"Внутри тебя уже есть пространство, в котором можно дышать.": "There is already room inside you to breathe.",
"Создай созвездие": "Create a Constellation",
"Заряженный": "Charged Up",
"Тёплые жёлтые лучи, бодрящее сияние и очень приятная энергия. Это вайб для подъёма, мотивации и лёгкого драйва.": "Warm rays, uplifting light, and an easy boost of energy for a brighter, more motivated moment.",
"День начинается не с скорости, а с света.": "A day begins with light, not with rushing.",
"Энергия — это не шум, а тепло внутри.": "Energy is not noise; it is warmth within.",
"Когда внутри солнце, даже мелочи начинают играть.": "When there is sunshine inside, little things come alive.",
"Двигайся к своему ритму — он тоже сияет.": "Move at your own pace — it shines, too.",
"Собери солнечный поток": "Gather the Sunshine",
"Неоновый": "Neon",
"Городские огни, чёрный фон и тикание ритма. Здесь можно включить характер и почувствовать ночную магию.": "City lights, a midnight rhythm, and a little nocturnal magic to bring out your bold side.",
"Ночь — это не затемнение, а свет в другом ключе.": "Night is not the absence of light; it is light in another key.",
"Ритм делает пространство живым, даже если вокруг тишина.": "Rhythm brings a space to life, even in silence.",
"Неон не кричит — он просто горит на своём волнении.": "Neon does not shout; it simply glows with its own energy.",
"Город дышит в ритме тех, кто умеет слышать его.": "The city breathes in time with those who know how to listen.",
"Неоновый ритм": "Neon Rhythm",
"Уединенный": "Secluded",
"Лесной отдых": "Forest Pause",
"Тёплый зелёный воздух, мягкий свет и спокойные ритмы природы. Здесь можно переключиться на уют, тишину и восстановление.": "Soft light, fresh green air, and nature’s quiet rhythm — a gentle place to pause and recharge.",
"Под шумом листьев мысли становятся мягче.": "Thoughts grow gentler beneath the rustle of leaves.",
"Тихий свет — это тоже бережность.": "Soft light is a form of kindness, too.",
"Там, где есть воздух и листья, есть пространство для дыхания.": "Where there is fresh air and leaves, there is room to breathe.",
"Сделай паузу — лес уже умеет ей помогать.": "Take a pause; the forest knows how to help.",
"Лови листья: ветер меняет направление.": "Catch the Leaves",
"Лови листья: ветер меняет направление их полёта.": "Catch the leaves as the wind shifts their path.",
"Ночной": "Night",
"Тихий город, свет в окнах и неоновые вывески. Иди в собственном ритме и замечай маленькие огни вокруг.": "A quiet city, glowing windows, and neon signs. Explore at your own pace and notice the little lights around you.",
"Ночью даже знакомый путь становится открытием.": "At night, even a familiar path can feel new.",
"Некоторые окна светят ровно тогда, когда нужно.": "Some windows glow just when you need them.",
"Город не одинок, пока в нём горит свет.": "A city is never lonely while a light is on.",
"Тихий город засыпает, оставляя тебя наедине с мыслями.": "The quiet city falls asleep, leaving you alone with your thoughts.",
"Свет неоновых вывесок отражается в каплях на стекле.": "The light of neon signs reflects in the drops on the glass.",
"В собственном ритме замечай маленькие огни вокруг.": "In your own rhythm, notice the small lights around you.",
"Ночь смывает дневной шум, открывая бесконечность звезд.": "Night washes away the day's noise, revealing the infinity of stars.",
"Night Walk": "Night Walk",
"Меланхоличный": "Melancholic",
"Спокойные капли на стекле, тихие мысли и простор для чувств без спешки и оценок.": "Raindrops on glass, quiet thoughts, and space to feel without rushing or judging yourself.",
"Дождю не нужно объяснять, почему он идёт.": "The rain does not have to explain why it falls.",
"Мягкий свет особенно красив в пасмурный день.": "Soft light is especially lovely on a cloudy day.",
"Пусть мысли побудут рядом, не требуя ответа.": "Let your thoughts stay awhile without asking for answers.",
"Лови капли": "Catch the Raindrops",
"Дзен": "Zen",
"Чистые линии, водные переливы и медленный ритм, в котором можно просто присутствовать.": "Clean lines, flowing water, and a slow rhythm that lets you simply be here.",
"Волна приходит и уходит — берег остаётся.": "The wave comes and goes; the shore remains.",
"Достаточно одного спокойного вдоха.": "One calm breath is enough.",
"Покой не нужно заслуживать.": "You do not have to earn your peace.",
"Дыхание воды": "Breathing Water",
"Хаотичный": "Chaotic",
"Яркие импульсы, неожиданные повороты и энергия, которой нужен простор для движения.": "Bright sparks, unexpected turns, and energy that needs room to move.",
"Не каждый поворот нужно было планировать.": "Not every turn needs a plan.",
"Искра тоже знает, куда лететь.": "Even a spark knows where to go.",
"Порядок подождёт — сейчас твой ход.": "Order can wait; it is your turn now.",
"Разнеси комнату": "Room in Motion",
"Позитивный": "Positive",
"Лёгкое настроение, яркие цвета и повод замечать хорошее в самых простых моментах.": "A light mood, bright colors, and a reminder to notice the good in everyday moments.",
"Радость любит маленькие поводы.": "Joy loves the little things.",
"Улыбка тоже задаёт ритм.": "A smile can set the rhythm, too.",
"Свет становится больше, когда им делятся.": "Light grows when you share it.",
"Лопай шарики": "Pop the Balloons",
"Загадочный": "Mysterious",
"Полутени, загадки и любопытство, которое ведёт к ответам шаг за шагом.": "Soft shadows, small mysteries, and curiosity that reveals the way one step at a time.",
"Подсказка часто прячется на виду.": "A clue is often hiding in plain sight.",
"Любопытство — хороший ключ.": "Curiosity is a good key.",
"Не всё тайное должно оставаться тёмным.": "Not every secret has to stay in the dark.",
"Найди код": "Find the Code",
"Вдохновленный": "Inspired",
"Цвета, формы и идеи встречаются в маленьких деталях — собери пейзаж под своё настроение.": "Colors, shapes, and ideas meet in the details. Paint a landscape that matches your mood.",
"Идея может начаться с одной линии.": "An idea can begin with a single line.",
"Необычное сочетание — тоже твой почерк.": "An unexpected combination can be your signature.",
"Создавай не ради правил, а ради ощущения.": "Create for the feeling, not for the rules.",
"Paint by Numbers": "Paint by Numbers",
"Природный": "Natural",
"Зелёные тропы, движение листьев и живая тишина, в которой легко восстановиться.": "Green paths, drifting leaves, and a living quiet that makes it easy to recharge.",
"Лес не торопит — и ты можешь не торопиться.": "The forest is in no hurry, and neither are you.",
"Ветер меняет направление, не теряя себя.": "The wind changes direction without losing itself.",
"Каждый лист находит свой путь вниз.": "Every leaf finds its own way down.",
"Поймай лист": "Catch a Leaf",
"Ностальгический": "Nostalgic",
"Retro Arcade": "Retro Arcade",
"Пиксельные огни, аркадные цвета и короткое путешествие в знакомый игровой ритм.": "Pixel lights, arcade colors, and a quick trip into a familiar game rhythm.",
"Новая попытка — классика жанра.": "One more try — a timeless classic.",
"Собирай моменты, не только очки.": "Collect moments, not just points.",
"У хорошей игры всегда есть ещё один раунд.": "A good game always has room for one more round.",
"Ламповый": "Cozy Vibes",
"Тёплый свет, мягкие вещи и пространство, которое можно обустроить именно под себя.": "Warm light, soft textures, and a space you can make your own.",
"Уют складывается из того, что тебе подходит.": "Comfort comes from what feels right to you.",
"Плед и пауза — хороший план.": "A blanket and a pause make a lovely plan.",
"Дом начинается с ощущения безопасности.": "Home begins with a feeling of safety.",
"Cozy Room": "Cozy Room",
"Цветной поток": "Color Flow",
"Неоновый тетрис": "Neon Tetris",
"Линии": "Lines",
"Логическая головоломка: переливай цвета между колбами": "Logic puzzle: pour the colors between the flasks",
"Переливай цвета между колбами — заполни каждую одним цветом.": "Pour the colors between the flasks — fill each one with a single color.",
"Все цвета собраны! Новый набор через мгновение.": "All colors are sorted! A new set is coming right up.",
"Эта колба пустая — выбери другую.": "That flask is empty — choose another one.",
"Выбери колбу, куда перелить цвет.": "Choose the flask to pour the color into.",
"Выбор снят.": "Selection cleared.",
"Так перелить нельзя — выбрана другая колба.": "That pour is not allowed — a different flask is selected.",
"Сюда цвет не поместится. Попробуй другую колбу.": "The color will not fit here. Try another flask.",
"Цвета перелиты. Продолжай сортировать.": "Colors poured. Keep sorting.",
"Новая головоломка": "New puzzle",
"Колба %s": "Flask %s",
"Тетрис: собирай линии": "Tetris: clear the lines",
"Далее": "Next",
"Игра окончена": "Game over",
"Очки: %s": "Score: %s",
"Игра окончена. Нажми «Начать заново».": "Game over. Press “Play again”.",
"Линия очищена! Комбо: %s": "Line cleared! Combo: %s",
"Стрелки или WASD — движение, ↑/W — поворот, пробел — сброс.": "Arrow keys or WASD to move, ↑/W to rotate, Space to drop.",
"Повернуть": "Rotate",
"Сбросить": "Drop",
"Создавай созвездие": "Create a Constellation",
"Тихий поиск": "Quiet Search",
"Соединяй звёзды созвездия в любом порядке.": "Connect the stars to shape the constellation.",
"Соедини звёзды по порядку: от 1 до 6.": "Connect the stars in order, from 1 to 6.",
"Созвездие для соединения": "Constellation to connect",
"Звезда %s": "Star %s",
"Сейчас нужна звезда %s.": "Star %s is next.",
"Соединено звёзд: %s/6.": "Stars connected: %s/6.",
"Созвездие готово! Все звёзды соединены.": "Constellation complete! Every star is connected.",
"Начать тихий поиск": "Begin a quiet search",
"Тайная комната со скрытыми звёздами": "Secret room with hidden stars",
"Скрытая звезда %s": "Hidden star %s",
"Здесь нет таймера и неправильных ответов. Начни поиск, когда захочешь.": "There is no timer and no wrong answer. Begin whenever you like.",
"Проведи светом по комнате и коснись найденных звёзд.": "Sweep the light around the room and tap the stars you find.",
"Комната наполнилась мягким светом. Все звёзды найдены.": "The room is filled with soft light. Every star is found.",
"В комнате становится светлее.": "The room is getting brighter.",
"Касайся появляющихся солнечных искр.": "Tap the little sparks of sunshine as they appear.",
"Лови световой импульс, пока он движется.": "Catch the pulse of light as it moves.",
"Собирай мерцающие листья и наслаждайся тишиной.": "Gather the glowing leaves and enjoy the quiet.",
"Собраны все три световых следа. Ночная улица проснулась.": "All three traces of light are found. The night street has come alive.",
"Подойди ближе к объекту «%s».": "Move closer to “%s”.",
"По луже расходятся круги дождя.": "Raindrops send ripples across the puddle.",
"Загорелся объект «%s».": "“%s” lights up.",
"Объект «%s» снова погас.": "“%s” dims again.",
"Ищи три световых следа. Нажми E рядом с фонарём, окном, вывеской или лужей.": "Find three traces of light. Press E near the lamp, window, sign, or puddle.",
"Шаг за шагом исследуй ночную улицу.": "Explore the night street one step at a time.",
"Исследуй улицу с WASD или экранными кнопками: собери три световых следа. Нажми E рядом с объектом.": "Explore with WASD or the on-screen controls. Find three traces of light; press E near an object.",
"Night Walk — исследуй ночную улицу": "Night Walk — explore the night street",
"Фонарь": "Lamp",
"Окна": "Windows",
"Вывеска": "Neon sign",
"Лужа": "Puddle",
"Световой след": "Trace of light",
"Твой персонаж": "Your character",
"Вверх": "Up",
"Влево": "Left",
"Вправо": "Right",
"Вниз": "Down",
"Управление движением": "Movement controls",
"Начать заново": "Play again",
"Касайся капель на стекле. Здесь не бывает проигрыша.": "Touch the raindrops on the glass. There is no losing here.",
"Капля растаяла на стекле.": "A raindrop melted on the glass.",
"Нажми и удерживай, когда волна расширяется. Можно просто наблюдать.": "Press and hold as the wave expands, or simply watch.",
"нажми и дыши": "press and breathe",
"Волна замерла. Отпусти в удобный момент.": "The wave is still. Let go whenever it feels right.",
"Волна снова дышит в своём ритме.": "The wave is breathing in its own rhythm again.",
"Ещё один предмет отправился в полёт!": "Another object is on the move!",
"Нажимай на предметы комнаты: раунд длится 25 секунд.": "Tap the room objects. The round lasts 25 seconds.",
"Время:": "Time:",
"с": "s",
"Лопай шарики: каждое попадание подряд увеличивает комбо.": "Pop balloons; each consecutive hit builds your combo.",
"Найди три подсказки в комнате, затем введи код.": "Find the three clues in the room, then enter the code.",
"Старая лампа": "Old lamp",
"Закрытая книга": "Closed book",
"Остановленные часы": "Stopped clock",
"Код из 3 цифр": "3-digit code",
"Введите трёхзначный код": "Enter the three-digit code",
"Проверить": "Check",
"Сначала найди все три подсказки.": "Find all three clues first.",
"Замок открыт — тайна разгадана!": "The lock opens — mystery solved!",
"Код не подошёл. Подсказки: лампа — 4, книга — 2, часы — 7.": "That code did not work. The clues are: lamp 4, book 2, clock 7.",
"Раскраска по номерам: закат над горами и озером": "Paint by numbers: sunset over mountains and lake",
"Контурный пейзаж для раскрашивания": "An outlined landscape to color",
"Закат над озером": "Sunset over the lake",
"Восемь пронумерованных областей: небо, солнце, горы, озеро, отражение, холм и звезда.": "Eight numbered regions: sky, sun, mountains, lake, reflection, hill, and star.",
"Область 1: небо": "Region 1: sky",
"Область 3: дальние горы": "Region 3: distant mountains",
"Область 4: дальние горы": "Region 4: distant mountains",
"Область 2: солнце": "Region 2: sun",
"Область 5: озеро": "Region 5: lake",
"Область 7: передний холм": "Region 7: foreground hill",
"Область 6: отражение в воде": "Region 6: reflection in the water",
"Область 8: звезда": "Region 8: star",
"Выбери номер цвета, затем закрась области с таким же номером.": "Choose a color number, then fill the regions with the matching number.",
"Персиковое небо": "Peach sky",
"Золотое солнце": "Golden sun",
"Лиловые горы": "Lavender mountains",
"Синие горы": "Blue mountains",
"Бирюзовое озеро": "Turquoise lake",
"Золотое отражение": "Golden reflection",
"Зелёный холм": "Green hill",
"Светлая звезда": "Bright star",
"Пейзаж готов — цвета сложились в твой закат.": "Your landscape is complete — the colors have made your sunset.",
"Раскраска сброшена. Выбери цвет и найди области с таким номером.": "The picture is reset. Choose a color and find the matching regions.",
"Все листья собраны. Лес снова тих и спокоен.": "All the leaves are gathered. The forest is quiet again.",
"Двигайся клавишами WASD или экранными кнопками, собирай ★ и обходи ■.": "Move with WASD or the on-screen controls, collect ★, and avoid ■.",
"Перетаскиваемые предметы уютной комнаты": "Items you can arrange in the cozy room",
"Кресло": "Armchair",
"Лампа": "Lamp",
"Растение": "Plant",
"Плед": "Blanket",
"Книги": "Books",
"Подушка": "Cushion",
"Свеча": "Candle",
"Комната готова. Вещи расставлены по-своему — уют получился.": "The room is ready. Everything is arranged your way, and it feels just right.",
"Перетащи любые четыре предмета и создай свою уютную комнату.": "Move any four items to make the room your own.",
"Перетащи любые четыре предмета. На компьютере двигай выбранный предмет клавишами WASD.": "Move any four items. On desktop, move the selected item with WASD.",
"На компьютере двигай выбранный предмет клавишами WASD.": "On desktop, move the selected item with WASD.",
"Цвет %s: %s": "Color %s: %s",
"Цвет %s — %s. Найди области с номером %s.": "Color %s — %s. Find regions numbered %s.",
"Область %s уже раскрашена.": "Region %s is already colored in.",
"Не тот цвет: области %s нужен цвет %s.": "Not quite: region %s needs color %s.",
"Верно! Раскрашено %s из %s областей.": "That is right! %s of %s regions colored.",
"Собрано листьев: %s/%s. Ветер меняет направление.": "Leaves gathered: %s/%s. The wind is shifting.",
"Вопрос %s из %s": "Question %s of %s",
"Change language": "Change language",
"Choose language": "Choose language",
"English": "English",
"Russian": "Russian",
};

const dynamicTranslations = [
  {
    pattern: /^Вопрос (\d+) из (\d+)$/,
    render: (match, locale) => {
      const [question, total] = match.slice(1);
      if (locale === 'en') return `Question ${question} of ${total}`;
      return match[0];
    },
  },
  {
    pattern: /^Световой след найден: (\d+)\/3\. Исследуй улицу дальше\.$/,
    render: (match, locale) => {
      if (locale === 'en') return `Trace of light found: ${match[1]}/3. Keep exploring the street.`;
      return match[0];
    },
  },
  {
    pattern: /^Подойди ближе к объекту «(.+)»\.$/,
    render: (match, locale) => {
      const object = translateText(match[1]);
      if (locale === 'en') return `Move closer to “${object}”.`;
      return match[0];
    },
  },
  {
    pattern: /^Загорелся объект «(.+)»\.$/,
    render: (match, locale) => {
      const object = translateText(match[1]);
      if (locale === 'en') return `“${object}” lights up.`;
      return match[0];
    },
  },
  {
    pattern: /^Объект «(.+)» снова погас\.$/,
    render: (match, locale) => {
      const object = translateText(match[1]);
      if (locale === 'en') return `“${object}” dims again.`;
      return match[0];
    },
  },
  {
    pattern: /^Подсказок найдено: (\d+) из 3\.$/,
    render: (match, locale) => {
      if (locale === 'en') return `Clues found: ${match[1]} of 3.`;
      return match[0];
    },
  },
  {
    pattern: /^Выбран цвет (\d+) — (.+)\. Найди области с номером \1\.$/,
    render: (match, locale) => {
      const name = translateText(match[2]);
      if (locale === 'en') return `Color ${match[1]} selected — ${name}. Find regions numbered ${match[1]}.`;
      return match[0];
    },
  },
  {
    pattern: /^Область (\d+) уже раскрашена\.$/,
    render: (match, locale) => locale === 'en' ? `Region ${match[1]} is already colored in.` : match[0],
  },
  {
    pattern: /^Не тот цвет: области (\d+) нужен цвет (\d+)\.$/,
    render: (match, locale) => locale === 'en' ? `Not quite: region ${match[1]} needs color ${match[2]}.` : match[0],
  },
  {
    pattern: /^Верно! Раскрашено (\d+) из (\d+) областей\.$/,
    render: (match, locale) => locale === 'en' ? `That is right! ${match[1]} of ${match[2]} regions colored.` : match[0],
  },
  {
    pattern: /^Собрано листьев: (\d+)\/(\d+)\. Ветер меняет направление\.$/,
    render: (match, locale) => locale === 'en' ? `Leaves gathered: ${match[1]}/${match[2]}. The wind is shifting.` : match[0],
  },
  {
    pattern: /^Раунд завершён! Разнесено предметов: (\d+)\.$/,
    render: (match, locale) => locale === 'en' ? `Round over! Objects sent flying: ${match[1]}.` : match[0],
  },
  {
    pattern: /^Хлоп! Комбо ×(\d+)$/,
    render: (match, locale) => locale === 'en' ? `Pop! Combo ×${match[1]}` : match[0],
  },
  {
    pattern: /^Комната становится уютнее: перемещено предметов (\d+)\/4\.$/,
    render: (match, locale) => locale === 'en' ? `The room is getting cozier: ${match[1]}/4 items moved.` : match[0],
  },
  {
    pattern: /^(.+) выбрано\. Перетащи предмет или передвинь его клавишами WASD\.$/,
    render: (match, locale) => {
      const item = translateText(match[1]);
      return locale === 'en' ? `${item} selected. Drag it or move it with WASD.` : match[0];
    },
  },
  {
    pattern: /^(.+) на новом месте\. Расставь любые четыре предмета\.$/,
    render: (match, locale) => {
      const item = translateText(match[1]);
      return locale === 'en' ? `${item} is in a new spot. Arrange any four items.` : match[0];
    },
  },
  {
    pattern: /^(.+) Перетащи, чтобы переместить\.$/,
    render: (match, locale) => {
      const item = translateText(match[1]);
      return locale === 'en' ? `${item}. Drag to move.` : match[0];
    },
  },
  {
    pattern: /^(Вверх|Влево|Вправо|Вниз) \(([WASD])\)$/,
    render: (match, locale) => {
      const direction = translateText(match[1]);
      return locale === 'en' ? `${direction} (${match[2]})` : match[0];
    },
  },
  {
    pattern: /^(\d+) с$/,
    render: (match, locale) => locale === 'en' ? `${match[1]} s` : match[0],
  },
  {
    pattern: /^(Старая лампа|Закрытая книга|Остановленные часы): (\d)$/,
    render: (match, locale) => {
      const clue = translateText(match[1]);
      return locale === 'en' ? `${clue}: ${match[2]}` : match[0];
    },
  },
  {
    pattern: /^Цвет (\d+): (.+)$/,
    render: (match, locale) => {
      const name = translateText(match[2]);
      return locale === 'en' ? `Color ${match[1]}: ${name}` : match[0];
    },
  },
  {
    pattern: /^Звезда (\d+)$/,
    render: (match, locale) => locale === 'en' ? `Star ${match[1]}` : match[0],
  },
  {
    pattern: /^Сейчас нужна звезда (\d+)\.$/,
    render: (match, locale) => locale === 'en' ? `Star ${match[1]} is next.` : match[0],
  },
  {
    pattern: /^Соединено звёзд: (\d+)\/6\.$/,
    render: (match, locale) => locale === 'en' ? `Stars connected: ${match[1]}/6.` : match[0],
  },
  {
    pattern: /^Скрытая звезда (\d+)$/,
    render: (match, locale) => locale === 'en' ? `Hidden star ${match[1]}` : match[0],
  },
  {
    pattern: /^Найдено звёзд: (\d+)\/5\. В комнате становится светлее\.$/,
    render: (match, locale) => locale === 'en' ? `Stars found: ${match[1]}/5. The room is getting brighter.` : match[0],
  },
  {
    pattern: /^Колба (\d+)$/,
    render: (match, locale) => locale === 'en' ? `Flask ${match[1]}` : match[0],
  },
  {
    pattern: /^Очки: (\d+)$/,
    render: (match, locale) => locale === 'en' ? `Score: ${match[1]}` : match[0],
  },
  {
    pattern: /^Линия очищена! Комбо: (\d+)$/,
    render: (match, locale) => locale === 'en' ? `Line cleared! Combo: ${match[1]}` : match[0],
  },
];

export { localeCodes, localeMetadata };

let currentLanguage = 'ru';
const textSources = new WeakMap();
const attributeSources = new WeakMap();
let languageToggle = null;
let languageOptions = null;

// Ключ хранения выбранного языка (тот же паттерн, что у прочих настроек сайта).
const LANGUAGE_STORAGE_KEY = 'vibefinder:lang';

function readStoredLanguage() {
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return localeCodes.includes(value) ? value : null;
  } catch (error) {
    return null;
  }
}

function storeLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) { /* приватный режим — тихо игнорируем */ }
}

export function translateText(source) {
  const text = String(source);
  // Русский — язык-источник и язык по умолчанию: возвращаем текст без изменений.
  if (currentLanguage === 'ru') return text;
  const key = text.trim();
  const exact = translationCatalog[key];
  if (exact !== undefined) return preserveWhitespace(text, exact);
  for (const translation of dynamicTranslations) {
    const match = key.match(translation.pattern);
    if (match) return preserveWhitespace(text, translation.render(match, currentLanguage));
  }
  return text;
}

function preserveWhitespace(source, translated) {
  const leading = source.match(/^\s*/)?.[0] || '';
  const trailing = source.match(/\s*$/)?.[0] || '';
  return `${leading}${translated}${trailing}`;
}

// Узлы под [data-no-i18n] не переводятся: их содержимое — машинный код/числа,
// а не локализуемый текст (например, ярлык переключателя «RU/EN»). Это защищает
// программно выставленные значения от отката наблюдателем перевода.
function isExcluded(node) {
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  return !!(element && typeof element.closest === 'function' && element.closest('[data-no-i18n]'));
}

function localizeTextNode(node) {
  if (isExcluded(node)) return;
  if (!textSources.has(node)) textSources.set(node, node.nodeValue || '');
  const source = textSources.get(node);
  const translated = translateText(source);
  if (node.nodeValue !== translated) node.nodeValue = translated;
}

function localizeAttribute(element, name) {
  if (!attributeSources.has(element)) attributeSources.set(element, new Map());
  const sources = attributeSources.get(element);
  if (!sources.has(name)) sources.set(name, element.getAttribute(name) || '');
  const translated = translateText(sources.get(name));
  if (element.getAttribute(name) !== translated) element.setAttribute(name, translated);
}

function translateTree(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    localizeTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root !== document.body) return;
  if (root instanceof Element) {
    ['aria-label', 'aria-description', 'placeholder', 'title', 'alt'].forEach((name) => {
      if (root.hasAttribute(name)) localizeAttribute(root, name);
    });
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    localizeTextNode(node);
    node = walker.nextNode();
  }
  if (root instanceof Element) {
    root.querySelectorAll('*').forEach((element) => {
      ['aria-label', 'aria-description', 'placeholder', 'title', 'alt'].forEach((name) => {
        if (element.hasAttribute(name)) localizeAttribute(element, name);
      });
    });
  }
}

export function setLanguage(language) {
  if (!localeCodes.includes(language)) return;
  currentLanguage = language;
  document.documentElement.lang = localeMetadata[language].htmlLang;
  if (languageToggle) {
    // Ярлык «RU/EN» — машинный код, а не локализуемый текст. Обновляем его
    // напрямую (слой блика внутри кнопки сохраняем). Узел помечен
    // data-no-i18n, поэтому наблюдатель перевода его не перезаписывает.
    const label = languageToggle.querySelector('.control-label');
    if (label) label.textContent = localeMetadata[language].code;
    else languageToggle.textContent = localeMetadata[language].code;
  }
  document.querySelectorAll('[data-language]').forEach((option) => {
    option.setAttribute('aria-pressed', String(option.dataset.language === language));
  });
  translateTree(document.body);
  document.title = translateText('Vibe Finder');
  storeLanguage(language);
  window.dispatchEvent(new CustomEvent('vibe-language-change', { detail: { language } }));
}

// Инициализация локализации: навешивает поведение переключателя языков,
// запускает первичный перевод DOM и наблюдает за динамически созданными узлами.
export function initI18n(defaultLanguage = 'ru') {
  languageToggle = document.getElementById('language-toggle');
  languageOptions = document.getElementById('language-options');

  languageToggle.addEventListener('click', () => {
    const open = languageOptions.hidden;
    languageOptions.hidden = !open;
    languageToggle.setAttribute('aria-expanded', String(open));
    if (open) languageOptions.querySelector('button[aria-pressed="true"]')?.focus();
  });

  languageOptions.addEventListener('click', (event) => {
    const option = event.target.closest('[data-language]');
    if (!option) return;
    setLanguage(option.dataset.language);
    languageOptions.hidden = true;
    languageToggle.setAttribute('aria-expanded', 'false');
    languageToggle.focus();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.language-switcher')) {
      languageOptions.hidden = true;
      languageToggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || languageOptions.hidden) return;
    languageOptions.hidden = true;
    languageToggle.setAttribute('aria-expanded', 'false');
    languageToggle.focus();
  });

  // Стартуем с ранее сохранённого языка, иначе — с языка по умолчанию.
  translateTree(document.body);
  setLanguage(readStoredLanguage() || defaultLanguage);

  const translationObserver = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === 'characterData') {
        localizeTextNode(record.target);
        return;
      }
      if (record.type === 'attributes') {
        localizeAttribute(record.target, record.attributeName);
        return;
      }
      record.addedNodes.forEach((node) => translateTree(node));
    });
  });

  translationObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-label', 'aria-description', 'placeholder', 'title', 'alt'],
    characterData: true,
    childList: true,
    subtree: true,
  });

  document.documentElement.classList.add('i18n-ready');
}
