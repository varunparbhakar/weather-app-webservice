--Create Global Chat room, ChatId 2
INSERT INTO
    chats(chatid, name)
VALUES
    (2, 'Global Chat Copy')
RETURNING *;

--Add the three test users to Global Chat
INSERT INTO
    ChatMembers(ChatId, MemberId)
SELECT 2, Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
   OR Members.Email='mom@gmail.com'
   OR Members.Email='test3@test.com'
RETURNING *;

--Add Multiple messages to create a conversation
INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Hello Everyone!',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'hi',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Hey Test2, how is it going?',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Great, thanks for asking t3',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Enough with the pleasantries',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Lets get down to business',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'CHILL out t3 lol',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'OK ok. T2, what did you do since the last meeting?',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Nothing.',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Im completly blocked by t3',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Get your act together and finish the messaging end points',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Woah now. Im waiting on t1...',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'I had a mid-term. :-(',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;


INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'But lets keep this cordial please',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'So, t2, t3 is blocking you',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    '...and Im blocking t3',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'sounds like you get another day off.',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Nope. Im just going to do all the work myself',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'No way am I going to fail because fo you two. ',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Ok ok. No. Charles wont be happy with that.',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'My exam is over now. Ill get cracking on this thing',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'I can knoock it out tonight',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'If I get it by tmorrow AM',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'i can finish by the aftershock',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'aftershock',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'afternoon!!! stupid autocorrect',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'Sounds like a plan',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'lets do it',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'lets dooooooo it',
    Members.MemberId
FROM Members
WHERE Members.Email='test1@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    '3 2 1 Break',
    Members.MemberId
FROM Members
WHERE Members.Email='test3@test.com'
RETURNING *;

INSERT INTO
    Messages(ChatId, Message, MemberId)
SELECT
    2,
    'l8r',
    Members.MemberId
FROM Members
WHERE Members.Email='mom@gmail.com'
RETURNING *;