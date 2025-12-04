load TeamGB.mat
lengte
gewicht
L1=lengte(1:15,1);
L2=lengte(1:15,2);
L3=lengte(1:15,3);
L4=lengte(1:15,4);
L5=lengte(1:15,5);
G1=gewicht(1:15,1);
G2=gewicht(1:15,2);
G3=gewicht(1:15,3);
G4=gewicht(1:15,4);
G5=gewicht(1:15,5);
p1=plot(L1,G1,'r*')
p2=plot(L2,G2,'b*')
p3=plot(L3,G3,'g*')
p4=plot(L4,G4,'ro')
p5=plot(L5,G5,'g+')
lmod1=LinearModel.fit(L1,G1); %beter: lmod1=fitlm(L1,G1)
lmod2=LinearModel.fit(L2,G2);
lmod3=LinearModel.fit(L3,G3);
lmod4=LinearModel.fit(L4,G4);
lmod5=LinearModel.fit(L5,G5);
p1=plot(lmod1)    % of duidelijker...plotAdded
pa1=plotAdded(lmod1)
pa2=plotAdded(lmod2)
pa3=plotAdded(lmod3)
pa4=plotAdded(lmod4)
pa5=plotAdded(lmod5)
c1=predint(fit(L1,G1,'poly1'),170,0.95) %prediction
c2=predint(fit(L2,G2,'poly1'),170,0.95) %prediction
c3=predint(fit(L3,G3,'poly1'),170,0.95) %prediction
c4=predint(fit(L4,G4,'poly1'),170,0.95) %prediction
c5=predint(fit(L5,G5,'poly1'),170,0.95) %prediction



