-- Based on 2026-11-23 Muse address research, with manual-review records excluded.
-- These are street addresses corroborated by published venue or directory sources.
-- Never persist Google Places-derived coordinates indefinitely; see Maps Platform terms.
-- Seven held: two Claireport duplicates, Canadian Convention Centre, Eraa Palace,
-- Nu Royal Palace, Sankkamam Banquet Hall, and Queen Palace (disputed closure).
DO $planwedly$
DECLARE updated_count integer;
BEGIN
  WITH researched(vendor_id, vendor_name, street_address, city_override) AS (
    VALUES ('9c042843-f5e7-4c0e-9531-ed1ba4c8d06b', 'Apollo Convention Centre', '6591 Innovator Dr, Mississauga, ON L5T 2V8', NULL),
('afc90d3d-0ae9-430b-afc7-09fb45871d51', 'Ascott Parc Event Centre', '2839 Rutherford Road, Vaughan, ON L4K 2N7', NULL),
('ee93b5b7-3768-4f70-8f53-1be2e743e370', 'Baba Banquet Hall', '3300 McNicoll Ave, Scarborough, ON M1V 5J6', NULL),
('aa468332-0253-4c0b-b9c8-0c678ae47706', 'Borgata Event Centre by Avani', '8400 Jane St, Vaughan, ON L4K 4L8', NULL),
('1edf5d1f-0c8c-4c87-9869-95fd75d6ef13', 'Casa Loma', '1 Austin Terrace, Toronto, ON M5R 1X8', NULL),
('ea410873-dfd4-4bb5-a14c-00b03c08c5d9', 'Chandni Banquet Hall', '125 Chrysler Dr, Brampton, ON L6S 6L1', NULL),
('36dbbad6-ccfb-4ce9-826d-5476cd34c132', 'Chandni Convention Centre', '5 Gateway Blvd, Brampton, ON L6T 4X2', NULL),
('2b7be283-9d6f-408b-8e49-94fa2a7b0257', 'Chateau Le Jardin Event Venue', '8440 Highway 27, Woodbridge, ON L4H 0A7', NULL),
('e9645d15-19ba-4c1a-9910-a76e37ce9b43', 'Crystal Fountain Event Venue', '60 McDowell Gate, Markham, ON L6G 1B5', NULL),
('fd5487a2-ba9d-44b8-82f5-62d48d815e2f', 'Deer Creek Golf & Banquet Facility', '2700 Audley Road N, Ajax, ON L1Z 1T7', NULL),
('1eb86a9d-9317-4044-b302-4fe9210e9bd4', 'Dreams Convention Centre', '75 Hedgedale Rd, Brampton, ON L6T 5P3', NULL),
('0348447d-774c-4dc1-90a8-27e287fcfb39', 'Embassy Grand Convention Centre', '8800 The Gore Rd, Brampton, ON L6P 0B1', NULL),
('3ae1fb76-40b8-4dd7-a6a8-a469f6b54aca', 'Grand Cinnamon Banquet & Convention Centre', '3895 McNicoll Ave, Scarborough, ON M1X 0C1', NULL),
('76394420-36b5-4ee2-9138-b6e138f82f11', 'Grand Empire Banquet and Convention Centre', '100 Nexus Ave, Brampton, ON L6P 3R6', NULL),
('3cef02bf-b5b3-4f16-b789-0941a906b4fd', 'Graydon Hall Manor', '185 Graydon Hall Dr, Toronto, ON M3A 3B1', NULL),
('909a4f84-5c45-4cbf-9317-1829bd10daea', 'J & J Swagat Convention Centre', '415 Hood Rd #22, Markham, ON L3R 3W2', NULL),
('c7cd3586-22b9-4cac-be3e-8d2303d98b93', 'JC''s Banquet & Convention Centre', '1686 Ellesmere Rd, Scarborough, ON M1H 2V5', NULL),
('338c073a-3e31-41fb-bf91-230880dc80cd', 'JJ Best Western Banquet Hall', '1468 Victoria Park Ave, Toronto, ON M4A 2M2', NULL),
('182dccb5-ed5d-4eec-874f-67ea16fd2179', 'Liberty Grand Entertainment Complex', '25 British Columbia Rd, Toronto, ON M6K 3C3', NULL),
('140fc5ed-2663-45e1-9f87-a56a04dd1cce', 'Markham Convention Centre', '30 Ironside Crescent, Toronto, ON M1X 0B7', 'Scarborough'),
('9f478b2d-d264-4b69-b89f-4da5cfd42998', 'Mississauga Convention Centre', '75 Derry Rd W, Mississauga, ON L5W 1G3', NULL),
('5c8fdd1d-61fc-4b03-93f8-dae8e393f79c', 'New Jasmin Banquet Hall', '90 Nolan Ct, Markham, ON L3R 4L9', NULL),
('b83d594b-3c1f-41c2-9074-42d04addd96c', 'Pearson Convention Centre', '2638 Steeles Ave E, Brampton, ON L6S 6J9', NULL),
('13b8bb82-68ae-4afc-936d-b30a40e278c9', 'QSSIS Banquet Hall', '3474 Kingston Rd, Scarborough, ON M1M 1R5', NULL),
('2e904840-23ce-4d35-8d2a-02f06c61a093', 'Queen''s Manor Event Centre', '2 Auction Ln, Brampton, ON L6T 0C4', NULL),
('53fa7078-6b04-49c1-8858-9f1d0935f897', 'Red Rose Convention Centre', '1233 Derry Rd E, Mississauga, ON L5T 1B6', NULL),
('a4602a9b-d126-44a9-8d00-a571bf6d1e36', 'Royal Ambassador Event Centre', '15430 Innis Lake Road, Caledon East, ON L7C 2Z1', NULL),
('e4d3a21e-24e1-4652-bae9-8d2a7f1c08c7', 'Royal Ashburn Golf Club', '995 Myrtle Rd W, Whitby, ON L0B 1A0', NULL),
('f7ac8768-09c0-4ee4-b096-5f9688ba7ccb', 'Royal King Event Centre', '181 Rexdale Blvd, Etobicoke, ON M9W 1P7', NULL),
('0768b6c5-fa1f-4253-b76b-6bec4c9fcdbb', 'Scarborough Convention Centre', '20 Torham Pl, Scarborough, ON M1X 0B3', NULL),
('86807e99-0a83-4ee1-9d37-809256de5ce6', 'Scarborough Event Centre', '5637 Finch Ave E, Unit 1, Scarborough, ON M1B 5K9', NULL),
('6ad7fb71-513c-45b7-a468-8831a4d0afa3', 'The Arlington Estate', '8934 Huntington Rd, Vaughan, ON L4H 4X1', NULL),
('b8f6419a-b3a9-4484-94fb-54c7c2da4626', 'The Estate Banquet & Event Centre', '430 Nugget Ave, Scarborough, ON M1S 4A4', NULL),
('d887ae4b-b5d2-4543-8861-4f2a6a3d0963', 'The Royalton', '8201 Weston Rd, Vaughan, ON L4L 1A6', NULL),
('119b462a-4829-4812-adde-52954b0a7748', 'The White Shield Banquet Hall', '2300 Lawrence Ave E, Scarborough, ON M1P 2R2', NULL),
('20685fc8-26c1-4a3d-9a9b-0a512c7ad1da', 'Trillium Trails Banquet & Conference Centre', '53 Snow Ridge Ct, Building 1, Oshawa, ON L1H 0S5', NULL),
('1b1cee4b-9d13-48f5-8037-a2609a080698', 'Versailles Convention Centre', '6721 Edwards Blvd, Mississauga, ON L5T 2V9', NULL),
('476179d9-48b8-4f4d-bfdd-02849de02adf', 'Woodbine Banquet and Hotel', '30 Vice Regent Blvd, Etobicoke, ON M9W 7A4', NULL)
  ), updated AS (
    UPDATE public.vendors v SET
      street_address = researched.street_address,
      city = coalesce(researched.city_override,v.city)
    FROM researched
    JOIN public.vendor_categories cat ON cat.slug='venues'
    WHERE v.id=researched.vendor_id::uuid AND v.name=researched.vendor_name AND v.category_id=cat.id
    RETURNING v.id
  )
  SELECT count(*) INTO updated_count FROM updated;
  IF updated_count<>38 THEN RAISE EXCEPTION 'Expected 38 matching venue records; found %',updated_count; END IF;
END $planwedly$;
